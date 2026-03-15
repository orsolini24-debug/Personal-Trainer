import type { Metadata } from "next"
import { Inter, Sora } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

export const metadata: Metadata = {
  title: "Performance Ecosystem",
  description: "AI Human Performance Lab",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-theme="cobalt">
      <body className={`${inter.variable} ${sora.variable} ${inter.className}`}>{children}</body>
    </html>
  )
}
