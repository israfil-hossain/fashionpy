// Site-wide social share card. Pages with page-specific artwork (products,
// blog posts) override it; every other page falls back to this file.
export const DEFAULT_OG_IMAGE = "/og-image.png";

export const defaultOgImage = (baseUrl: string) => [
  {
    url: `${baseUrl}${DEFAULT_OG_IMAGE}`,
    width: 1200,
    height: 630,
    alt: process.env.NEXT_PUBLIC_SITE_NAME || "FashionPy",
  },
];
