import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'PM SHRI Kendriya Vidyalaya - Student Management System',
  description: 'A modern, responsive, role-based Student Management System (SMS) for PM SHRI Kendriya Vidyalaya Mahuldiha, supporting records management, attendance, exam marks, and progress reports.',
  keywords: 'PM SHRI, Kendriya Vidyalaya, Student Management System, SMS, KV Mahuldiha, Education Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-blue-700 selection:text-white">
        {children}
      </body>
    </html>
  )
}
