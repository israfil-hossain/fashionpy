import type { Metadata } from 'next';

import './globals.css';

import { Toaster } from '@medusajs/ui';

import { GoogleAnalytics } from '@/components/atoms/GoogleAnalytics/GoogleAnalytics';
import { HtmlLangSetter } from '@/components/atoms/HtmlLangSetter/HtmlLangSetter';
import { retrieveCart } from '@/lib/data/cart';
import { defaultOgImage } from '@/lib/helpers/og-image';

import { Providers } from './providers';

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'FashionPy';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    template: `%s | ${siteName}`,
    default: siteName
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'FashionPy - Your marketplace for fashion, beauty and lifestyle products',
  metadataBase: new URL(baseUrl),
  alternates: {
    languages: {
      'x-default': baseUrl
    }
  },
  openGraph: {
    type: 'website',
    siteName,
    images: defaultOgImage(baseUrl)
  },
  twitter: {
    card: 'summary_large_image',
    images: defaultOgImage(baseUrl)
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/f_logo.svg', type: 'image/svg+xml' }
    ],
    apple: '/f_logo.svg'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cartPromise = retrieveCart();

  // LocaleProvider sets the visitor's language once the [locale] segment renders.
  const htmlLang = 'en';

  return (
    <html
      lang={htmlLang}
      className=""
    >
      <head>
        <link
          rel="preconnect"
          href="https://i.imgur.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://i.imgur.com"
        />
        {/* Image origins for faster LCP */}
        <link
          rel="preconnect"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://s3.eu-central-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://api.mercurjs.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://api.mercurjs.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative bg-primary text-secondary antialiased">
        <GoogleAnalytics />
        <HtmlLangSetter />
        <Providers cartPromise={cartPromise}>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
