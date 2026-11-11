import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Navbar } from '@/components/layout/Navbar';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from '@/components/analytics/Analytics';
import { WhatsAppFloatingButton } from '@/components/ui/WhatsAppButton';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { NavigationProgress } from '@/components/ui/NavigationProgress';
import { BRAND_NAME } from '@/lib/constants';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const viewport: Viewport = {
  themeColor: '#064e3b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} | Luxury Clothes & Artisanal Bags Pakistan`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    'Discover handcrafted luxury lawn, stitched pret apparel, and genuine leather bags in Pakistan. Cash on Delivery (COD) available nationwide with 7-day hassle-free exchanges.',
  keywords: [
    'online shopping pakistan',
    'pakistani clothes',
    'lawn suits',
    'leather bags pakistan',
    'cash on delivery',
    'pret wear',
    'unstitched lawn',
    BRAND_NAME,
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: `${BRAND_NAME} | Luxury Clothes & Artisanal Bags Pakistan`,
    description:
      'Handcrafted luxury pret apparel and artisanal leather bags. Free delivery above Rs. 3,000 with Cash on Delivery nationwide.',
    siteName: BRAND_NAME,
    locale: 'en_PK',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-neutral-900 flex flex-col min-h-screen`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AuthProvider>
          <CartProvider>
            <AnnouncementBar />
            <Navbar />
            <CategoryNav />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <Footer />
            <Analytics />
            <WhatsAppFloatingButton />
            <ServiceWorkerRegister />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
