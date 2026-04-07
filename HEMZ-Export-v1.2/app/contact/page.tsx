import type { Metadata } from "next"
import ContactPageClient from "./ContactPageClient"

export const metadata: Metadata = {
  title: "Contact Us | Luxury Textiles Export",
  description:
    "Get in touch with our export team for quotes on premium cashmere shawls, pashmina, and scarves. We serve luxury markets worldwide.",
  openGraph: {
    title: "Contact Us | Luxury Textiles Export",
    description:
      "Request quotes for premium textile exports. Professional service for wholesale and boutique customers.",
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}
