import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mortgage Extra Payment Calculator',
  description: 'Vibe coded with v0 and some fixes by me',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
