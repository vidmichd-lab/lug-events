import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Афиша событий | Музеи, театры, концерты и многое другое',
  description: 'Откройте для себя лучшие события в вашем городе. Музеи, театры, кафе, рестораны, кинотеатры и интересные места. Сохраняйте в избранное и подписывайтесь на места.',
  keywords: 'афиша, события, музеи, театры, концерты, кафе, рестораны, кинотеатры',
  authors: [{ name: 'Events Platform' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

