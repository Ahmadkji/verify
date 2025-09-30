import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VerifyAPI - Modern Email & Phone Verification API",
  description: "Validate emails and phone numbers instantly with our powerful API. Reduce fraud, improve deliverability, and boost conversion rates with real-time verification.",
  keywords: "email verification, phone validation, API, fraud prevention, deliverability, verification service",
  authors: [{ name: "VerifyAPI" }],
  creator: "VerifyAPI",
  publisher: "VerifyAPI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://verifyapi.com'),
  openGraph: {
    title: "VerifyAPI - Modern Email & Phone Verification API",
    description: "Validate emails and phone numbers instantly with our powerful API. Reduce fraud, improve deliverability, and boost conversion rates.",
    url: 'https://verifyapi.com',
    siteName: 'VerifyAPI',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VerifyAPI - Email and Phone Verification Service',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VerifyAPI - Modern Email & Phone Verification API',
    description: 'Validate emails and phone numbers instantly with our powerful API.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                      console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
