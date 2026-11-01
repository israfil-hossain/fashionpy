import { HttpTypes } from '@medusajs/types';
import { NextRequest, NextResponse } from 'next/server';

import { PROTECTED_ROUTES } from './lib/constants';
import { isTokenExpired } from './lib/helpers/token';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'bd';

const REGION_FETCH_RETRIES = 3;
const REGION_FETCH_TIMEOUT_MS = 4_000;

const makeAuthRedirect = (
  req: NextRequest,
  locale: string,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const redirectUrl = new URL(`/${locale}/login`, req.url);

  redirectUrl.searchParams.set(reason, 'true');

  const response = NextResponse.redirect(redirectUrl);

  if (reason === 'sessionExpired') {
    response.cookies.delete('_medusa_jwt');
  }

  return response;
};

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: 0
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchRegionsWithRetry() {
  let lastError: unknown;

  for (let attempt = 0; attempt < REGION_FETCH_RETRIES; attempt++) {
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_API_KEY!
        },
        signal: AbortSignal.timeout(REGION_FETCH_TIMEOUT_MS)
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.message || `Regions request failed with ${response.status}`);
      }

      return (await response.json()) as { regions?: HttpTypes.StoreRegion[] };
    } catch (error) {
      lastError = error;
      if (attempt < REGION_FETCH_RETRIES - 1) {
        await sleep(200 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache;
  const cacheFresh = regionMap.keys().next().value && regionMapUpdated > Date.now() - 3600 * 1000;

  if (cacheFresh) {
    return regionMap;
  }

  try {
    const { regions } = await fetchRegionsWithRetry();

    if (!regions?.length) {
      throw new Error('No regions found. Please set up regions in your Medusa Admin.');
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach(c => {
        regionMapCache.regionMap.set(c.iso_2 ?? '', region);
      });
    });

    regionMapCache.regionMapUpdated = Date.now();
  } catch (error) {
    // Backend may be booting or briefly down (common in dev). Fall back to the
    // default region so the storefront still serves instead of erroring out.
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[proxy] Could not load regions from ${BACKEND_URL} (${(error as Error)?.message}). ` +
          `Falling back to default region "${DEFAULT_REGION}". ` +
          `Is the Medusa API running? MEDUSA_BACKEND_URL=${BACKEND_URL}`
      );
    }

    if (!regionMapCache.regionMap.has(DEFAULT_REGION)) {
      regionMapCache.regionMap.set(DEFAULT_REGION, {
        countries: [{ iso_2: DEFAULT_REGION }]
      } as HttpTypes.StoreRegion);
      regionMapCache.regionMapUpdated = Date.now();
    }
  }

  return regionMapCache.regionMap;
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode;

    const vercelCountryCode = request.headers.get('x-vercel-ip-country')?.toLowerCase();

    const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode;
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode;
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION;
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value;
    }

    return countryCode;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[proxy] Error resolving country code:', error);
    }
  }
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const cacheIdCookie = request.cookies.get('_medusa_cache_id');
  const cacheId = cacheIdCookie?.value || crypto.randomUUID();

  const urlSegment = pathname.split('/')[1];
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || '');

  const pathnameWithoutLocale = looksLikeLocale ? pathname.replace(/^\/[^/]+/, '') : pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  if (isProtectedRoute) {
    const jwtCookie = request.cookies.get('_medusa_jwt');
    const token = jwtCookie?.value;

    const locale = looksLikeLocale ? urlSegment : DEFAULT_REGION;

    if (!jwtCookie) {
      return makeAuthRedirect(request, locale, 'sessionRequired');
    }

    if (token && isTokenExpired(token)) {
      return makeAuthRedirect(request, locale, 'sessionExpired');
    }
  }

  if (looksLikeLocale && cacheIdCookie) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, {
      maxAge: 60 * 60 * 24
    });
  }

  const regionMap = await getRegionMap();
  const countryCode = regionMap && (await getCountryCode(request, regionMap));
  const urlHasCountryCode = countryCode && pathname.split('/')[1].includes(countryCode);

  if (!urlHasCountryCode && countryCode) {
    const redirectPath = pathname === '/' ? '' : pathname;
    const queryString = request.nextUrl.search ? request.nextUrl.search : '';
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)'
  ]
};
