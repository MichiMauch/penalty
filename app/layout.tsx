import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'PENALTY',
  description: 'Penalty-Duell für jedermann - 5 Penalty entscheiden!',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}