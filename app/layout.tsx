import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AudioProvider } from "@/contexts/AudioContext"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import { Navigation } from "@/components/sections/Navigation"
import { Footer } from "@/components/sections/Footer"
import { SITE_URL } from "@/lib/constants"

const inter = Inter({ subsets: ["latin"], display: "swap" })

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CyberJustiça Brasil",
  url: SITE_URL,
  description:
    "Plataforma dedicada à investigação e combate aos crimes cibernéticos no Brasil. Episódios, análises e recursos para proteção digital.",
  publisher: {
    "@type": "Organization",
    name: "CyberJustiça Brasil",
    url: SITE_URL,
  },
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CyberJustiça Brasil - Investigação de Crimes Cibernéticos",
    template: "%s",
  },
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
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
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
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased`}>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-cyan-500 focus:text-black focus:px-4 focus:py-2 focus:rounded"
        >
          Pular para o conteúdo
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AudioProvider>
          <Navigation />
          <main id="conteudo">{children}</main>
          <Footer />
          <AudioPlayer />
        </AudioProvider>
      </body>
    </html>
  )
}
