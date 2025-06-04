import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AudioProvider } from "@/contexts/AudioContext"
import { UIProvider } from "@/contexts/UIContext"
import { BookmarkProvider } from "@/contexts/BookmarkContext"
import { RatingProvider } from "@/contexts/RatingContext"
import { DashboardProvider } from "@/contexts/DashboardContext"
import { ExpertsProvider } from "@/contexts/ExpertsContext"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CyberJustiça Brasil - Investigação de Crimes Cibernéticos",
  description:
    "Plataforma dedicada à investigação e combate aos crimes cibernéticos no Brasil. Episódios, análises e recursos para proteção digital.",
  keywords: [
    "crimes cibernéticos",
    "segurança digital",
    "investigação",
    "Brasil",
    "proteção online",
    "fraudes digitais",
    "cybersecurity",
  ],
  authors: [{ name: "CyberJustiça Brasil" }],
  creator: "CyberJustiça Brasil",
  publisher: "CyberJustiça Brasil",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://cyberjustica.brasil.gov.br",
    title: "CyberJustiça Brasil - Investigação de Crimes Cibernéticos",
    description:
      "Plataforma dedicada à investigação e combate aos crimes cibernéticos no Brasil. Episódios, análises e recursos para proteção digital.",
    siteName: "CyberJustiça Brasil",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberJustiça Brasil - Investigação de Crimes Cibernéticos",
    description:
      "Plataforma dedicada à investigação e combate aos crimes cibernéticos no Brasil. Episódios, análises e recursos para proteção digital.",
  },
    generator: 'v0.dev'
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
          <ExpertsProvider>
            <DashboardProvider>
              <AudioProvider>
                <UIProvider>
                  <BookmarkProvider>
                    <RatingProvider>{children}</RatingProvider>
                  </BookmarkProvider>
                </UIProvider>
              </AudioProvider>
            </DashboardProvider>
          </ExpertsProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
