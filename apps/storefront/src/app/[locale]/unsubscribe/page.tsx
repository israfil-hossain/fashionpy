"use client"

import { useEffect, useState } from "react"

import { unsubscribeEmail } from "@/lib/data/email"

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const [state, setState] = useState<"loading" | "done" | "error">("loading")

  useEffect(() => {
    if (!searchParams.token) {
      setState("error")
      return
    }
    unsubscribeEmail(searchParams.token).then(result => {
      setState(result.success ? "done" : "error")
    })
  }, [searchParams.token])

  return (
    <main className="container mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="heading-lg uppercase text-primary">Email preferences</h1>
      {state === "loading" && (
        <p className="label-md mt-4 text-secondary">Updating your preferences…</p>
      )}
      {state === "done" && (
        <p className="label-md mt-4 text-primary">
          You are unsubscribed from FashionPy follow-up emails. Order emails will
          still be sent.
        </p>
      )}
      {state === "error" && (
        <p className="label-md mt-4 text-negative">
          This unsubscribe link is invalid or has expired.
        </p>
      )}
    </main>
  )
}
