# Arham Collection — Production E-Commerce Platform (Pakistan Market)

A high-performance, mobile-first e-commerce web platform engineered with **Next.js 14 (App Router, TypeScript)**, **TailwindCSS**, **Supabase (PostgreSQL with Row Level Security)**, and **Cloudinary**. 

Built natively for Pakistan's e-commerce ecosystem, featuring **Cash on Delivery (COD)**, Pakistani phone number validation (`03xx`), major Pakistani cities logistics integration, and an extensible category architecture starting with **Clothes** and **Bags**.

---

## 🏗️ Architecture & Tech Stack

- **Framework:** Next.js 14.2+ (App Router, Server Actions, Dynamic Metadata)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Vanilla TailwindCSS 3.4 (Tailored palette, responsive mobile-first)
- **Database & Auth:** Supabase (PostgreSQL 15+, Row-Level Security, Relational Schema, Sequence triggers)
- **Media Delivery:** Cloudinary Node.js SDK v2 (AVIF/WebP auto-formatting, size-chart separation)
- **State Management:** React Context + LocalStorage persistence for Cart and Guest Checkout
- **Validation:** Zod 3 + React Hook Form 7 (Pakistani phone regex, city selectors)
- **SEO & Structured Data:** Dynamic `sitemap.ts`, `robots.ts`, Open Graph, JSON-LD Product Schema
- **Deployment Target:** Vercel

---

## 📁 Project Structure

```text
├── app/
│   ├── actions/
│   │   └── order.ts                      # Server Action: Order placement & atomic inventory deduction
│   ├── api/
│   │   ├── categories/route.ts           # REST endpoint for category hierarchy
│   │   ├── orders/route.ts               # REST endpoint for order placement
│   │   ├── products/route.ts             # REST endpoint for catalog querying
│   │   └── upload/route.ts               # Cloudinary server-side upload route
│   ├── cart/page.tsx                     # Dedicated Shopping Bag page with Pakistan COD & shipping meter
│   ├── category/[slug]/page.tsx          # Dynamic Category page with server fetching, filters, sorting
│   ├── categories/[slug]/page.tsx        # Route alias for plural URL support
│   ├── checkout/page.tsx                 # Fast Guest Checkout with Pakistani cities & phone validation
│   ├── order-confirmation/[orderId]/     # Order Confirmation screen with order reference (PK-10042)
│   ├── product/[slug]/page.tsx           # Product Detail Page (PDP) with SEO & JSON-LD
│   ├── products/[slug]/page.tsx          # Route alias for plural URL support
│   ├── error.tsx                         # Global client error boundary with retry CTA
│   ├── layout.tsx                        # Global layout (Navbar, CategoryNav, CartDrawer, Footer, Analytics)
│   ├── loading.tsx                       # Global page suspense skeleton
│   ├── not-found.tsx                     # Custom 404 page with smart navigation links
│   ├── page.tsx                          # Luxury Storefront Homepage (Hero, Categories, Trending)
│   ├── robots.ts                         # Search engine crawler configuration
│   └── sitemap.ts                        # Dynamic sitemap indexer for products & categories
├── components/
│   ├── analytics/
│   │   └── Analytics.tsx                 # Google Analytics 4 & Meta Pixel integration
│   ├── cart/
│   │   └── CartDrawer.tsx                # Slide-over shopping cart drawer
│   ├── category/
│   │   ├── CategoryFilter.tsx            # Price range, size, color, stock filter & sort controls
│   │   └── CategoryPageView.tsx          # Interactive category client container
│   ├── layout/
│   │   ├── AnnouncementBar.tsx           # Top bar: Free shipping over Rs. 3,000 & WhatsApp line
│   │   ├── CategoryNav.tsx               # Dynamic sub-navigation bar
│   │   ├── Footer.tsx                    # Trust badges, Pakistan payment methods, contact details
│   │   └── Navbar.tsx                    # Header with responsive mobile drawer & cart counter
│   ├── products/
│   │   ├── ImageGallery.tsx              # PDP gallery filtering out size charts, thumbnail strip
│   │   ├── LoadingSkeleton.tsx           # Accessible skeleton loaders for grids & PDPs
│   │   ├── ProductCard.tsx               # Product card with PKR formatting, discount badge & quick add
│   │   ├── ProductDetailView.tsx         # Complete interactive PDP view with variant selector
│   │   ├── ProductGrid.tsx               # Responsive product grid
│   │   ├── SizeChartModal.tsx            # Modal with image view & structured measurement table
│   │   └── VariantSelector.tsx           # Size & color selector disabling out-of-stock items
│   └── ui/
│       ├── Badge.tsx                     # Status tags and discount chips
│       └── Button.tsx                    # Reusable button with variants & loading state
├── hooks/
│   └── useCart.tsx                       # Cart context with localStorage sync & free shipping calculation
├── lib/
│   ├── cloudinary.ts                     # Cloudinary config, server upload & delivery URL helper
│   ├── constants.ts                      # Pakistan cities list, brand defaults, fallback seed catalog
│   ├── supabase.ts                       # Supabase client (browser client, server admin service role)
│   ├── utils.ts                          # PKR currency formatting (Rs. 4,850), phone validator, cn
│   └── validations/
│       └── order.ts                      # Zod validation schema for checkout
├── scripts/
│   └── seed-admin.mjs                    # CLI script to provision the first super admin
├── supabase/
│   ├── migrations/
│   │   ├── 20241027000001_initial_schema.sql       # 7 core tables, triggers, sequences, indexes
│   │   ├── 20241027000002_row_level_security.sql   # RLS security policies for public and admins
│   │   └── 20241027000003_seed_data.sql            # Clothes & Bags seed categories, products, variants
│   ├── schema.sql                        # Consolidated single SQL file for 1-click execution
│   └── seed_admin.sql                    # SQL script to promote an existing user to admin
└── .env.example                          # Fully documented environment variable template
```

---

## 🚀 Quick Start & Setup Guide

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd e-commerce-website
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Cloudinary
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Store Brand & Pakistani Market Configuration
NEXT_PUBLIC_BRAND_NAME="Arham Collection"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CURRENCY_SYMBOL="Rs."
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD="3000"
NEXT_PUBLIC_STANDARD_SHIPPING_FEE="200"
NEXT_PUBLIC_WHATSAPP_NUMBER="+923001234567"
NEXT_PUBLIC_SUPPORT_EMAIL="support@arhamcollection.pk"
```

> **Note:** The platform includes graceful fallback seed data. If Supabase environment variables are left as placeholders, the storefront runs in seed demonstration mode without crashing!

---

## 🗄️ Supabase Database Setup

### Option A: 1-Click Execution via SQL Editor (Recommended)

1. Open your [Supabase Dashboard](https://app.supabase.com) and navigate to your project.
2. Click on **SQL Editor** in the left sidebar.
3. Open `supabase/schema.sql` from this codebase, copy its contents, paste them into the SQL Editor, and click **Run**.
4. This will automatically execute:
   - `pgcrypto` extension
   - `admins`, `categories`, `products`, `product_variants`, `product_images`, `orders`, `order_items` tables
   - Auto-updating `updated_at` triggers
   - Pakistani order sequence (`PK-10001+`)
   - Complete Row Level Security (RLS) policies
   - Seed data for **Clothes** (Pret & Unstitched Lawn) and **Bags** (Totes & Crossbody Bags)

### Option B: Supabase CLI Migrations

If using the Supabase CLI:

```bash
supabase db push
```

---

## 👤 Provisioning Your First Admin User

To give an administrator access to write to catalog tables and manage orders:

### Method 1: Using the CLI Script
```bash
node scripts/seed-admin.mjs admin@brandname.pk "StrongPassword123!" "super_admin"
```

### Method 2: Via Supabase SQL Editor
Run `supabase/seed_admin.sql` with your registered email:
```sql
INSERT INTO public.admins (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'your-email@brandname.pk'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

---

## ☁️ Cloudinary Setup

1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. Go to **Dashboard** and copy the **API Environment variable** (`CLOUDINARY_URL`).
3. Paste into `.env.local`:
   ```env
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud_name>
   ```
4. Product images uploaded through `lib/cloudinary.ts` are automatically stored in the `ecommerce/products/` folder with auto WebP/AVIF compression.
5. In the `product_images` table, set `is_size_chart = true` for any garment/bag measurement chart image. The PDP image gallery will automatically omit it from product photos and display it inside the dedicated **Size Guide** modal.

---

## 📧 Transactional Email & Support Channels Setup

### 1. Resend or Postmark Configuration
The platform includes built-in transactional email delivery using either **Resend** or **Postmark**.
Emails are dispatched automatically for key lifecycle events:
- **Order Received (COD):** Triggered immediately upon checkout completion.
- **Order Confirmed:** Triggered when CSR marks order verified.
- **Order Shipped:** Triggered with live Courier (PostEx / Trax / Leopards / TCS) consignment tracking number and link.
- **Order Delivered:** Triggered on delivery with 7-day exchange notice.
- **Staff Inquiry Notice:** Alerts team when a customer submits the `/contact` form.
- **Support Reply by Email:** Allows staff to answer customer tickets from the `/admin/support` inbox.

> **Privacy & Pakistani Market Compliance:** In Pakistan, many customers order via phone only. The system strictly checks `if (!order.customerEmail) return;` and **only sends transactional emails when a valid email address was supplied**.

Add the following to `.env.local` or Vercel:
```env
# Choose either Resend or Postmark:
RESEND_API_KEY=re_123456789_abcdefg
# OR
POSTMARK_SERVER_TOKEN=your-postmark-token-here

# Sender identity (must match your verified domain):
EMAIL_FROM="Brand Name <orders@brandname.pk>"
STAFF_NOTIFICATION_EMAIL="support@brandname.pk"
```

### 2. SPF & DKIM DNS Configuration (100% Deliverability)
To ensure emails land in the customer's Inbox (not Spam or Promotions tab), configure these DNS records in your domain registrar (Cloudflare, Namecheap, GoDaddy):

#### A. SPF (Sender Policy Framework)
Add or update the root TXT record:
- **Type:** `TXT`
- **Host / Name:** `@`
- **Value (Resend):** `v=spf1 include:resend.com ~all`
- **Value (Postmark):** `v=spf1 include:spf.mtasv.net ~all`
*(If you already have an SPF record for Google Workspace / Microsoft 365, add `include:resend.com` before `~all`, e.g. `v=spf1 include:_spf.google.com include:resend.com ~all`).*

#### B. DKIM (DomainKeys Identified Mail)
Resend and Postmark will generate DKIM selector records in your dashboard. Add the CNAME or TXT records:
- **Type:** `CNAME`
- **Host / Name:** `resend._domainkey` (or selector provided in Resend console)
- **Value:** Provided in Resend / Postmark dashboard (e.g. `dkim.resend.com`)

#### C. DMARC (Domain-based Message Authentication)
Add a DMARC policy record:
- **Type:** `TXT`
- **Host / Name:** `_dmarc`
- **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.pk; pct=100; sp=none; aspf=r;`

---

## 💬 WhatsApp Concierge & Support Floating Button

A floating WhatsApp click-to-chat button is enabled globally across all storefront pages (`components/ui/WhatsAppButton.tsx`):
- **Safe Positioning:** Anchored at `bottom-20 sm:bottom-6 right-4 sm:right-6 z-40` to ensure it never overlaps mobile sticky Checkout or Add-to-Cart CTAs.
- **Context-Aware Prefill:**
  - On Product Detail Pages: Automatically prefills the product title and URL (`"Assalam-o-Alaikum! I have a question about [Product Name]: [URL]"`).
  - On Order Tracking / Confirmation: Prefills the order reference number.
  - On General Pages: Standard concierge greeting.
- **Store Settings:** Configure your business WhatsApp number in `.env.local`:
  ```env
  NEXT_PUBLIC_WHATSAPP_NUMBER="+923001234567"
  ```
- **Admin Safe:** Automatically hidden on all `/admin/*` management views.

---

## 📬 Customer Contact Form & Admin Support Inbox

1. **Honeypot Anti-Spam Protection:** The `/contact` form features an invisible `website_hp` field. Spambots filling this field are silently accepted without cluttering your database or triggering staff email alerts.
2. **Durable Rate Limiting:** Throttles submissions to a maximum of 3 messages per 5 minutes per IP connection and phone number.
3. **Admin Inbox (`/admin/support`):**
   - Displays all inquiries with status tabs: `All`, `New`, `In Progress`, `Closed`.
   - Direct Call and WhatsApp shortcuts for CSR staff.
   - **Reply by Email:** One-touch modal to email the customer with automatic template formatting, moving the ticket to `closed`.

---

## 🚢 Deployment to Vercel

1. Push your repository to GitHub or GitLab.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. In the **Environment Variables** section, add the variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CLOUDINARY_URL`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_BRAND_NAME`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel production domain, e.g., `https://brandname.pk`)
5. Click **Deploy**. Vercel will build and launch your production site with zero configuration!

---

## ✅ Pre-Launch Checklist

- [x] **Database Migrations:** Schema, RLS policies, and triggers verified in Supabase.
- [x] **Row Level Security (RLS):** Tested public read on active products and admin-only catalog write.
- [x] **Pakistani Checkout Flow:** Validated phone regex (`03001234567`), 25 Pakistani city dropdowns, and COD fee calculation.
- [x] **Inventory Protection:** Server Action rejects out-of-stock checkouts and atomically decrements stock.
- [x] **Size Guide Modal:** Tested Clothes (XS–XL in Inches & CM) and Bags dimensions with image fallback.
- [x] **Image Delivery:** Next Image configured with `res.cloudinary.com` remote patterns.
- [x] **SEO & Social Sharing:** `sitemap.xml`, `robots.txt`, dynamic Open Graph meta tags, and JSON-LD schema tested.
- [x] **Mobile Responsiveness:** 100% responsive navigation drawer, quick add, and touch-friendly cart drawer.
- [x] **TypeScript & Next.js Build:** `npm run build` generates 12 static/dynamic routes with exit code 0.
