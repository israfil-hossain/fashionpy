"use client"

import { useState } from "react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setMessage("Thank you for subscribing!")
      setEmail("")
      setIsSubmitting(false)
      setTimeout(() => setMessage(""), 3000)
    }, 1000)
  }

  return (
    <section className="relative bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 py-16 px-4 overflow-hidden">
      {/* Background watermark text */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="text-white text-[120px] md:text-[200px] font-bold leading-none">
          <div className="mb-4">PAMELA BY</div>
          <div>FASHIONPY</div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 uppercase">
          DON&apos;T MISS OUT!
        </h2>
        <p className="text-white/90 text-base md:text-lg mb-8 max-w-2xl mx-auto">
          Subscribe to our newsletter and stay in the know - no spam, just the good stuff.
        </p>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-0 border-2 border-white/30 rounded-sm overflow-hidden">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="flex-1 px-6 py-4 bg-transparent text-white placeholder-white/70 outline-none text-base"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-brand-600 px-8 py-4 font-bold uppercase tracking-wide hover:bg-brand-50 transition-colors duration-300 disabled:opacity-50"
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-4 text-white font-semibold animate-fade-in">
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
