import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';
import { retrieveCustomer } from "@/lib/data/customer"
import { safeRedirectPath } from "@/lib/helpers/safe-redirect"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
}

type SearchParams = Promise<{ redirect?: string }>

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginPageContent({ searchParams }: { searchParams: SearchParams }) {
  const { redirect: redirectParam } = await searchParams
  const user = await retrieveCustomer()

  if (user) {
    // Already signed in — honour a safe return target (e.g. the chatbot's
    // `/?chat=1`) instead of always bouncing to /user.
    redirect(safeRedirectPath(redirectParam) ?? "/user")
  }

  return <LoginForm />
}
