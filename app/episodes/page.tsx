import type { Metadata } from "next"
import { episodes } from "@/data/episodes"
import { EpisodesFilterGrid } from "@/components/episode/EpisodesFilterGrid"
import { SITE_URL } from "@/lib/constants"

const TITLE = "Episódios - CyberJustiça Brasil"
const DESCRIPTION = "Explore a coleção completa de casos reais de crimes cibernéticos investigados no Brasil, com análises, especialistas e recursos de proteção digital."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/episodes` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/episodes`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function EpisodesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
            EPISÓDIOS
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore nossa coleção completa de casos reais de crimes cibernéticos no Brasil
          </p>
        </div>

        <EpisodesFilterGrid episodes={episodes} />
      </div>
    </div>
  )
}
