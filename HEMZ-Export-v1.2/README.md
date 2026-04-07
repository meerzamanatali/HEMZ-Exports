# Luxury Textiles Export Website

A modern, responsive multi-page portfolio website for a textile export company specializing in cashmere shawls, pashmina, and scarves.

## Features

- **Multi-page Structure**: Home, Products, Product Details, About, Specialty, Contact
- **Product Management**: Advanced filtering, sorting, and search functionality
- **Export-focused**: MOQ information, lead times, bulk pricing
- **Contact System**: Professional inquiry form with email integration
- **SEO Optimized**: JSON-LD structured data, meta tags, sitemap
- **Responsive Design**: Mobile-first approach with elegant desktop experience
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: Radix UI primitives with shadcn/ui
- **Typography**: Playfair Display (headings) + Inter (body)
- **Email**: Multiple options (Formspree, SMTP, SendGrid)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd luxury-textiles-website
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configure your email service (choose one):

#### Option A: Formspree (Easiest - No backend required)
1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form and get your form ID
3. Update the fetch URL in `components/contact-form.tsx`:
\`\`\`typescript
const response = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
\`\`\`

#### Option B: SMTP (Gmail, Outlook, etc.)
1. Update `.env.local` with your SMTP credentials:
\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=export@luxurytextiles.com
\`\`\`

#### Option C: SendGrid
1. Get your SendGrid API key
2. Update `.env.local`:
\`\`\`env
SENDGRID_API_KEY=your-sendgrid-api-key
\`\`\`
3. Uncomment SendGrid configuration in `app/api/send-inquiry/route.ts`

5. Run the development server
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

## Customization

### Replace Product Images
1. Add your product images to `public/assets/products/[product-id]/`
2. Update image paths in `data/products.json`
3. Ensure each product has at least 4 high-quality images

### Update Product Data
Edit `data/products.json` to add/modify products:
\`\`\`json
{
  "id": "YOUR-SKU",
  "title": "Product Name",
  "type": "Shawl|Pashmina|Scarf",
  "material": "Material description",
  "price": 95.00,
  "photos": ["path1.jpg", "path2.jpg", "path3.jpg", "path4.jpg"],
  "moq": 50,
  "lead_time_days": 21
}
\`\`\`

### Customize Company Information
Update the following files:
- `components/header.tsx` - Logo and company name
- `components/footer.tsx` - Contact details and social links
- `app/layout.tsx` - Site metadata and SEO
- `app/contact/page.tsx` - Contact information

### Color Scheme
The design uses a luxury color palette defined in `app/globals.css`:
- Primary: Warm Gold (#D4AF37)
- Background: White (#FFFFFF) 
- Cards: Soft Cream (#FAF3E0)
- Text: Muted Charcoal (#333333)

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The site works on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## Email Setup Troubleshooting

### Gmail SMTP
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in `SMTP_PASS`

### Contact Form Not Working
1. Check browser console for errors
2. Verify environment variables are set
3. Test with a simple email service like Formspree first
4. Check spam folders for test emails

## SEO Features

- JSON-LD structured data for products
- Open Graph meta tags
- Semantic HTML structure
- Image alt attributes
- Sitemap.xml (add to `public/sitemap.xml`)
- Robots.txt (add to `public/robots.txt`)

## Support

For technical support or customization requests, please contact the development team or refer to the Next.js documentation.

## License

This project is proprietary software for Luxury Textiles Export Co.
