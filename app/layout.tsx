import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: "Deep Night — Soirée VIP 06 Juin 2026",
  description: "Système de billetterie VIP pour la Deep Night",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-950 text-white flex flex-col">{children}</body>
    </html>
  )
}
