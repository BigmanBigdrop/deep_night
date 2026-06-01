import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const viewport: Viewport = {
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: "Deep Night — Soirée VIP 06 Juin 2026",
  description: "Soirée privée VIP — 06 Juin 2026",
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
    shortcut: '/logo.jpeg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Deep Night',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-black text-white flex flex-col">{children}</body>
    </html>
  )
}
