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
