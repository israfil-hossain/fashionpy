import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { sdk } from '@/lib/client';
import { decodeJwt } from '@/lib/helpers/token';

export const runtime = 'nodejs';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

type CallbackResponse = {
  token?: string;
  mfa_required?: boolean;
  verification_required?: boolean;
};

const redirectLogin = (origin: string) =>
  NextResponse.redirect(new URL('/login', origin));

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Google returns `error` (e.g. access_denied) when the user cancels.
  if (searchParams.get('error') || !code || !state) {
    return redirectLogin(origin);
  }

  let token: string;
  try {
    const result = await (sdk.auth.$actorType.$authProvider.callback.query({
      $actorType: 'customer',
      $authProvider: 'google',
      code,
      state,
    } as never) as unknown as Promise<CallbackResponse>);

    if (!result?.token || result.mfa_required || result.verification_required) {
      return redirectLogin(origin);
    }

    token = result.token;
  } catch {
    return redirectLogin(origin);
  }

  const decoded = decodeJwt(token) as {
    actor_id?: string;
    user_metadata?: {
      email?: string;
      given_name?: string;
      family_name?: string;
    };
  } | null;

  // First sign-in with Google: the token has no linked customer yet, so create
  // one from the Google profile and refresh the token to pick up the actor.
  if (decoded && !decoded.actor_id && decoded.user_metadata?.email) {
    const authHeaders = { authorization: `Bearer ${token}` };

    try {
      await (sdk.store.customers.mutate({
        email: decoded.user_metadata.email,
        first_name: decoded.user_metadata.given_name,
        last_name: decoded.user_metadata.family_name,
        fetchOptions: { headers: authHeaders },
      } as never) as unknown as Promise<unknown>);
    } catch {
      // A customer with this email may already exist (signed up with password);
      // continue and let the refresh surface any real failure.
    }

    try {
      const refreshed = await (sdk.auth.token.refresh.mutate({
        fetchOptions: { headers: authHeaders },
      } as never) as unknown as Promise<CallbackResponse>);

      if (refreshed?.token) {
        token = refreshed.token;
      }
    } catch {
      // Keep the original token; /user will fall back to login if it is unusable.
    }
  }

  // Transfer the guest cart, mirroring the email/password login flow.
  const cartId = request.cookies.get('_medusa_cart_id')?.value;
  if (cartId) {
    await fetch(`${BACKEND_URL}/store/carts/${cartId}/customer`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'x-publishable-api-key': PUBLISHABLE_API_KEY as string,
      },
    }).catch(() => undefined);
  }

  const cookieStore = await cookies();
  const cacheId = cookieStore.get('_medusa_cache_id')?.value;
  if (cacheId) {
    revalidateTag(`customers-${cacheId}`, 'max');
  }

  const response = NextResponse.redirect(new URL('/user', origin));
  response.cookies.set('_medusa_jwt', token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
