import { Footer, Header } from "@/components/organisms"
import { retrieveCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { Session } from "@talkjs/react"
import { redirect } from "next/navigation"

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID
  const { locale } = await params

  const user = await retrieveCustomer()

  // Only check region if backend is available to avoid redirect loops
  try {
    const regionCheck = await checkRegion(locale)
    if (!regionCheck) {
      return redirect("/")
    }
  } catch (error) {
    // Silently skip region check if backend unavailable
    console.warn("Skipping region check:", error)
  }

  if (!APP_ID || !user)
    return (
      <>
        <Header />
        {children}
        <Footer />
      </>
    )

  return (
    <>
      <Session appId={APP_ID} userId={user.id}>
        <Header />
        {children}
        <Footer />
      </Session>
    </>
  )
}
