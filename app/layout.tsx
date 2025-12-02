import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuizFun Content Manager',
  description: 'Generare și management conținut educațional pentru QuizFun.app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
