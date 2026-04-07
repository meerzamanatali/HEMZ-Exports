import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/lib/contexts/cart-context"
import { WishlistProvider } from "@/lib/contexts/wishlist-context"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: {
    default: "Luxury Cashmere & Pashmina Export | Premium Textile Company",
    template: "%s | Luxury Textiles Export",
  },
  description:
    "Exquisite hand-woven cashmere shawls, pashmina, and scarves crafted for luxury markets worldwide. Premium textile export with traditional craftsmanship from Kashmir, India.",
  keywords: [
    "cashmere export",
    "pashmina wholesale",
    "luxury textiles",
    "Kashmir shawls",
    "textile export India",
    "premium scarves",
    "handwoven cashmere",
    "luxury boutique supplier",
    "wholesale textiles",
    "export quality cashmere",
    "HEMZ Export",
  ],
  authors: [{ name: "HEMZ Export.", url: "https://luxurytextiles.com" }],
  creator: "HEMZ Export",
  publisher: "Zamanat Ali Mir",
  metadataBase: new URL("https://luxurytextiles.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://luxurytextiles.com",
    siteName: "Luxury Textiles Export",
    title: "Luxury Cashmere & Pashmina Export | Premium Textile Company",
    description:
      "Premium hand-woven textiles for luxury markets worldwide. Exquisite cashmere shawls, pashmina, and scarves from Kashmir artisans.",
    images: [
      {
        url: "/luxury-cashmere-shawl-draped-elegantly-on-wooden-b.png",
        width: 1200,
        height: 630,
        alt: "Luxury cashmere textiles in natural lighting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Cashmere & Pashmina Export",
    description: "Premium hand-woven textiles for luxury markets worldwide",
    images: ["/luxury-cashmere-shawl-draped-elegantly-on-wooden-b.png"],
    creator: "@hemzexport",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  category: "business",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4AF37" />
        <meta name="color-scheme" content="light dark" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "HEMZ Export",
              url: "https://luxurytextiles.com",
              logo: "https://luxurytextiles.com/logo.png",
              description: "Premium cashmere and pashmina textile export company serving luxury markets worldwide",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Kondwa",
                addressLocality: "Pune",
                addressRegion: "Maharashtra",
                postalCode: "410503",
                addressCountry: "IN",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91-9284319583",
                contactType: "sales",
                email: "hezmexports@gmail.com",
                availableLanguage: ["English", "Hindi", "German"],
              },
              sameAs: [
                "https://www.facebook.com/luxurytextiles",
                "https://www.instagram.com/luxurytextiles",
                "https://www.linkedin.com/company/luxurytextiles",
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
                >
                  Skip to main content
                </a>
                {children}
                <Toaster />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
