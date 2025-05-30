import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AudioProvider } from "@/contexts/AudioContext"
import { UIProvider } from "@/contexts/UIContext"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { BookmarkProvider } from "@/contexts/BookmarkContext"
import { RatingProvider } from "@/contexts/RatingContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CyberJustiça Brasil - Histórias Reais de Crimes Cibernéticos",
  description:
    "Desvendamos os bastidores dos maiores crimes digitais do Brasil com histórias reais, especialistas renomados e dicas essenciais para sua proteção no mundo virtual.",
  keywords: ["crimes cibernéticos", "segurança digital", "fraudes online", "proteção digital", "Brasil"],
  authors: [{ name: "CyberJustiça Brasil" }],
  openGraph: {
    title: "CyberJustiça Brasil",
    description: "Histórias reais de crimes cibernéticos no Brasil",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberJustiça Brasil",
    description: "Histórias reais de crimes cibernéticos no Brasil",
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ErrorBoundary>
          <UIProvider>
            <AudioProvider>
              <BookmarkProvider>
                <RatingProvider>{children}</RatingProvider>
              </BookmarkProvider>
            </AudioProvider>
          </UIProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
