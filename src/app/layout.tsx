import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vela Scheduling Intelligence',
  description: 'AI-powered scheduling coordination demo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
