"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  X,
  FileText,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  Phone,
  MessageSquare,
  Lock,
  Heart,
  UserCheck,
  CreditCard,
  Headphones,
  Radio,
  Database,
  ChevronDown,
  Volume2,
  Download,
  Share2,
  Pause,
  SkipBack,
  SkipForward,
  VolumeX,
  Maximize2,
  Minimize2,
  Eye,
  Clock,
  MapPin,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Episode {
  id: number | string
  title: string
  date: string
  description: string
  status: string
  threat: string
  audioUrl?: string | null
  duration?: string
}

export default function CyberJusticaBrasil() {
  const [glitchText, setGlitchText] = useState("CYBERJUSTIÇA")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [activeEpisode, setActiveEpisode] = useState<number | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEpisodeModal, setSelectedEpisodeModal] = useState<Episode | null>(null)
  const [selectedLuluModal, setSelectedLuluModal] = useState<boolean>(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const glitchChars = ["█", "▓", "▒", "░", "▄", "▀", "■", "□", "◆", "◇"]
      const originalText = "CYBERJUSTIÇA"
      let glitched = originalText

      if (Math.random() < 0.3) {
        const randomIndex = Math.floor(Math.random() * originalText.length)
        const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)]
        glitched = originalText.substring(0, randomIndex) + randomChar + originalText.substring(randomIndex + 1)

        setTimeout(() => setGlitchText(originalText), 150)
      }

      setGlitchText(glitched)
    }, 2500)

    return () => clearInterval(glitchInterval)
  }, [])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
    }
  }, [currentEpisode])

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const episodes = [
    {
      id: 13,
      title: "Crimes cibernéticos, fraude e estelionato",
      date: "15/05/2024",
      description:
        "Revela como quadrilhas brasileiras estão utilizando tecnologias avançadas para aplicar golpes financeiros sofisticados e como as autoridades estão respondendo.",
      status: "ATIVO",
      threat: "ALTO",
      // Use a working demo audio URL or null for demo mode
      audioUrl: null, // Set to null to use demo mode
      duration: "45:30",
    },
    {
      id: 6,
      title: "Caso Lulu - uso indevido de dados pessoais",
      date: "2023",
      description:
        "Um dos casos mais impactantes de 2023, exploramos como criminosos utilizaram dados vazados para criar um esquema de fraude que afetou milhares de brasileiros.",
      status: "ARQUIVADO",
      threat: "CRÍTICO",
      audioUrl: "/placeholder-audio.mp3",
    },
    {
      id: 5,
      title: '"NaMoral" - Combate à corrupção nas redes',
      date: "2023",
      description:
        "Detalhamos a operação que desmantelou uma rede de corrupção que operava através de plataformas digitais, com entrevistas exclusivas dos investigadores.",
      status: "RESOLVIDO",
      threat: "MÉDIO",
      audioUrl: "/placeholder-audio.mp3",
    },
    {
      id: "ESPECIAL",
      title: "Proteção de crianças e adolescentes online",
      date: "06/05/2025",
      description:
        "Este especial abordará os perigos que crianças enfrentam online e estratégias eficazes de proteção, com depoimentos de especialistas.",
      status: "AGENDADO",
      threat: "ALTO",
      audioUrl: "/placeholder-audio.mp3",
    },
  ]

  const crimeTypes = [
    {
      icon: CreditCard,
      title: "FRAUDES FINANCEIRAS",
      desc: "Golpes bancários e estelionato digital",
      color: "red",
      threat: "CRÍTICO",
    },
    {
      icon: Database,
      title: "ROUBO DE DADOS",
      desc: "Uso indevido de informações pessoais",
      color: "orange",
      threat: "ALTO",
    },
    {
      icon: Heart,
      title: "CRIMES CONTRA DIGNIDADE",
      desc: "Violações da intimidade e dignidade sexual",
      color: "purple",
      threat: "ALTO",
    },
    {
      icon: UserCheck,
      title: "ALICIAMENTO ONLINE",
      desc: "Predadores digitais em redes sociais",
      color: "yellow",
      threat: "CRÍTICO",
    },
    {
      icon: Heart,
      title: "GOLPES EM RELACIONAMENTOS",
      desc: "Fraudes em aplicativos de encontros",
      color: "pink",
      threat: "MÉDIO",
    },
  ]

  const experts = [
    {
      name: "Diego Barbiero",
      role: "Coordenador do CyberGAECO",
      description:
        "Diego traz sua vasta experiência em investigações de crimes digitais organizados e compartilha casos emblemáticos que ajudou a solucionar.",
      status: "ATIVO",
      clearance: "NÍVEL 5",
    },
    {
      name: "Thiago Cardoso Silva",
      role: "Delegado do GAECO",
      description:
        "Especializado em crimes cibernéticos, Thiago detalha os desafios das investigações digitais e as novas técnicas utilizadas pelos criminosos.",
      status: "ATIVO",
      clearance: "NÍVEL 4",
    },
    {
      name: "Wilson Leite da Silva Filho",
      role: "Chefe da Divisão de Informática Forense",
      description:
        "Wilson explica as complexidades técnicas da coleta de provas digitais e como a tecnologia forense evolui para combater o crime.",
      status: "ATIVO",
      clearance: "NÍVEL 5",
    },
  ]

  const handleAudioError = useCallback((error: Event | Error, episode: Episode) => {
    console.error(`Failed to load audio for episode ${episode.id}:`, error)
    setIsLoading(false)
    setIsPlaying(false)
    setDuration(2730)
    setCurrentTime(0)
  }, [])

  const handlePlayEpisode = useCallback(
    (episode: Episode) => {
      setCurrentEpisode(episode)
      setCurrentTime(0)
      setIsLoading(true)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      if (!episode.audioUrl) {
        setIsLoading(false)
        setDuration(2730)
        setIsPlaying(true)
        startSimulatedPlayback()
        return
      }

      const audio = new Audio(episode.audioUrl)
      audioRef.current = audio
      audio.volume = isMuted ? 0 : volume

      const handleError = (e: Event) => handleAudioError(e, episode)
      const handleLoadStart = () => setIsLoading(true)
      const handleCanPlay = () => setIsLoading(false)

      audio.addEventListener("error", handleError)
      audio.addEventListener("loadstart", handleLoadStart)
      audio.addEventListener("canplay", handleCanPlay)

      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => handleAudioError(error, episode))
    },
    [volume, isMuted, handleAudioError],
  )

  const startSimulatedPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          setIsPlaying(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev + 1
      })
    }, 1000)
  }, [duration])

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(true)
            startSimulatedPlayback()
          })
      }
    } else if (currentEpisode) {
      setIsPlaying(!isPlaying)
      if (!isPlaying) {
        startSimulatedPlayback()
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [isPlaying, currentEpisode, startSimulatedPlayback])

  const handleSeek = useCallback((newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
    setCurrentTime(newTime)
  }, [])

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-red-500/10" />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6 backdrop-blur-sm bg-black/50 border-b border-cyan-500/30">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
                CYBERJUSTIÇA
              </span>
              <div className="text-xs text-gray-400 font-mono">BRASIL.SYS</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["CASOS", "PROTOCOLOS", "ESPECIALISTAS", "PROTEÇÃO", "DENÚNCIAS"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-cyan-400 hover:text-white transition-all duration-300 hover:glow-text relative group text-sm font-mono"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-red-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <Button className="bg-gradient-to-r from-cyan-500 to-red-600 hover:from-cyan-400 hover:to-red-500 border-0 shadow-lg shadow-cyan-500/25">
            <Headphones className="w-4 h-4 mr-2" />
            OUÇA AGORA
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-5xl mx-auto">
          <div className="mb-8">
            <Badge className="bg-gradient-to-r from-red-500/20 to-cyan-500/20 text-red-400 border-red-500/50 mb-4 font-mono">
              <AlertTriangle className="w-3 h-3 mr-1" />
              SISTEMA DE INVESTIGAÇÃO ATIVO
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4 relative">
            <span
              className="bg-gradient-to-r from-cyan-400 via-red-500 to-purple-500 bg-clip-text text-transparent animate-pulse"
              style={{
                textShadow: "0 0 30px rgba(0, 255, 255, 0.5)",
                filter: "drop-shadow(0 0 10px rgba(255, 0, 0, 0.3))",
              }}
            >
              {glitchText}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent opacity-30 blur-sm">
              {glitchText}
            </div>
          </h1>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            BRASIL: HISTÓRIAS REAIS DE <span className="text-red-400">CRIMES CIBERNÉTICOS</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed font-mono">
            <span className="text-cyan-400">{">"}</span> Desvendamos os bastidores dos maiores crimes digitais do
            Brasil. <span className="text-red-400">Histórias reais</span>, especialistas renomados e{" "}
            <span className="text-purple-400">dicas essenciais</span> para sua proteção no mundo virtual.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 shadow-lg shadow-red-500/25 group"
              onClick={() => handlePlayEpisode(episodes[0])}
            >
              <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              OUÇA AGORA
              <Volume2 className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
            >
              <Radio className="w-5 h-5 mr-2" />
              INSCREVA-SE
            </Button>
          </div>

          <div className="animate-bounce">
            <ChevronDown className="w-8 h-8 text-cyan-400 mx-auto" />
          </div>
        </div>

        {/* Animated Rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-96 h-96 border border-cyan-500/30 rounded-full animate-spin-slow" />
            <div className="absolute inset-4 border border-red-500/30 rounded-full animate-spin-reverse" />
            <div className="absolute inset-8 border border-purple-500/30 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
                SOBRE NOSSO PROTOCOLO
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Sistema de análise de crimes cibernéticos</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card className="bg-black/50 border-cyan-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    O <span className="text-cyan-400 font-mono">CyberJustiça Brasil</span> traz semanalmente análises
                    aprofundadas de casos reais de crimes cibernéticos que abalaram o país. Com especialistas em
                    segurança digital, autoridades e investigadores, desvendamos os métodos dos criminosos e como eles
                    foram capturados.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    Nossas entrevistas exclusivas com vítimas oferecem uma perspectiva única sobre o impacto desses
                    crimes, enquanto nosso conteúdo educativo fornece ferramentas práticas para sua proteção digital.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "50+", label: "CASOS ANALISADOS", color: "cyan" },
                { value: "100K+", label: "USUÁRIOS PROTEGIDOS", color: "red" },
                { value: "20+", label: "ESPECIALISTAS", color: "purple" },
                { value: "3", label: "ANOS ATIVOS", color: "green" },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group text-center"
                >
                  <CardContent className="p-6">
                    <div
                      className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm font-mono">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Episodes Section */}
      <section id="casos" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-red-400 to-cyan-500 bg-clip-text text-transparent">
                CASOS EM DESTAQUE
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Investigações digitais em andamento</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {episodes.map((episode, index) => (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm cursor-pointer"
                onClick={() => setActiveEpisode(activeEpisode === index ? null : index)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-800 text-cyan-400 font-mono">
                        EP {episode.id}
                      </Badge>
                      <Badge
                        className={`font-mono text-xs ${
                          episode.status === "ATIVO"
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : episode.status === "AGENDADO"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : episode.status === "RESOLVIDO"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }`}
                      >
                        {episode.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`font-mono text-xs ${
                          episode.threat === "CRÍTICO"
                            ? "bg-red-500/20 text-red-400 border-red-500/50"
                            : episode.threat === "ALTO"
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                        }`}
                      >
                        {episode.threat}
                      </Badge>
                      <span className="text-sm text-gray-500 font-mono">{episode.date}</span>
                    </div>
                  </div>
                  <CardTitle
                    className="group-hover:text-red-400 transition-colors font-mono cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (episode.id === 6) {
                        setSelectedLuluModal(true)
                      } else {
                        setSelectedEpisodeModal(episode)
                      }
                    }}
                  >
                    {episode.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors mb-4">
                    {episode.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayEpisode(episode)
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 mr-1" />
                      )}
                      {isLoading ? "CARREGANDO..." : "REPRODUZIR"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                      <Download className="w-3 h-3 mr-1" />
                      BAIXAR
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Crime Types */}
      <section id="protocolos" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-transparent">
                TIPOS DE AMEAÇAS CIBERNÉTICAS
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Classificação de vetores de ataque</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {crimeTypes.map((crime, index) => (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm text-center"
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r from-${crime.color}-500 to-${crime.color}-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <crime.icon className="w-8 h-8 text-white" />
                    </div>
                    <Badge
                      className={`font-mono text-xs mb-2 ${
                        crime.threat === "CRÍTICO"
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : crime.threat === "ALTO"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                      }`}
                    >
                      {crime.threat}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors font-mono">
                    {crime.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">{crime.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Experts */}
      <section id="especialistas" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                AGENTES ESPECIALIZADOS
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Equipe de investigação cibernética</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {experts.map((expert, index) => (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm"
              >
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-10 w-10 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-mono text-xs">
                      {expert.status}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 font-mono text-xs">
                      {expert.clearance}
                    </Badge>
                  </div>
                  <CardTitle className="group-hover:text-cyan-400 transition-colors font-mono">{expert.name}</CardTitle>
                  <CardDescription className="text-purple-400 font-mono">{expert.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm text-center">
                    {expert.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Protection Tips */}
      <section id="proteção" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                PROTOCOLOS DE SEGURANÇA
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Diretrizes de proteção cibernética</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Lock,
                title: "FORTALEÇA SUAS SENHAS",
                description:
                  "Utilize senhas fortes e únicas para cada serviço, preferencialmente com gerenciadores de senha. Ative a autenticação em dois fatores sempre que possível.",
                color: "blue",
              },
              {
                icon: Shield,
                title: "PROTEJA SEUS DADOS",
                description:
                  "Compartilhe informações pessoais apenas em sites seguros (https://). Evite fornecer dados sensíveis em redes públicas.",
                color: "green",
              },
              {
                icon: AlertTriangle,
                title: "IDENTIFIQUE TENTATIVAS DE GOLPE",
                description:
                  "Desconfie de ofertas imperdíveis, mensagens urgentes solicitando dados ou links suspeitos. Verifique sempre a legitimidade.",
                color: "orange",
              },
              {
                icon: Phone,
                title: "SAIBA COMO DENUNCIAR",
                description:
                  "Utilize os canais oficiais: delegacias especializadas, SaferNet, ou o portal de denúncias do Ministério Público.",
                color: "red",
              },
            ].map((tip, index) => (
              <Card
                key={index}
                className="bg-black/50 border-gray-800 hover:border-green-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-green-500/25 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r from-${tip.color}-500 to-${tip.color}-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <tip.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white group-hover:text-green-400 transition-colors font-mono text-sm">
                      {tip.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                ESTATÍSTICAS ALARMANTES
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Dados de ameaças cibernéticas no Brasil</p>
          </div>

          <Card className="bg-black/50 border-red-500/30 backdrop-blur-sm p-8 hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="h-12 w-12 text-red-500" />
                <span className="text-6xl font-bold text-red-500 font-mono">+100%</span>
              </div>
              <p className="text-xl text-gray-300 font-mono">AUMENTO NAS DENÚNCIAS DE CRIMES CIBERNÉTICOS DESDE 2018</p>
            </div>

            <Separator className="my-8 bg-gray-700" />

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gray-900/50 border-gray-700 p-6">
                <h4 className="font-bold text-cyan-400 mb-3 font-mono">GRUPOS MAIS VULNERÁVEIS</h4>
                <p className="text-gray-300 text-sm">
                  Idosos e jovens entre 18-25 anos são os alvos mais frequentes de golpistas que exploram inexperiência
                  digital ou confiança excessiva nas plataformas online.
                </p>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 p-6">
                <h4 className="font-bold text-purple-400 mb-3 font-mono">CRIMES MAIS COMUNS</h4>
                <p className="text-gray-300 text-sm">
                  Fraudes bancárias lideram o ranking, seguidas por crimes contra a dignidade sexual e roubo de dados
                  pessoais.
                </p>
              </Card>
            </div>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section id="denúncias" className="py-20 px-6 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                CANAIS DE COMUNICAÇÃO
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Estabeleça conexão com nossa central</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm text-center">
              <CardContent className="p-6">
                <MessageSquare className="h-12 w-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors font-mono">
                  SUGESTÕES DE TEMAS
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Tem uma história para compartilhar ou um tema que gostaria de ver abordado? Preencha nosso formulário
                  e ajude a construir nossos próximos episódios.
                </p>
                <Button variant="outline" size="sm" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                  ENVIAR SUGESTÃO
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-gray-800 hover:border-red-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-red-500/25 backdrop-blur-sm text-center">
              <CardContent className="p-6">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white mb-2 group-hover:text-red-400 transition-colors font-mono">
                  DENÚNCIAS
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Para denúncias de crimes cibernéticos, direcione-as aos canais oficiais: Delegacia Virtual, SaferNet
                  ou Ministério Público.
                </p>
                <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/10">
                  CANAIS OFICIAIS
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm text-center">
              <CardContent className="p-6">
                <Radio className="h-12 w-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-white mb-2 group-hover:text-purple-400 transition-colors font-mono">
                  ONDE NOS ENCONTRAR
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Disponível em todas as principais plataformas: Spotify, Apple Podcasts, Google Podcasts, Deezer e
                  YouTube.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                >
                  TODAS AS PLATAFORMAS
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Military Cybersecurity Modal */}
      {selectedEpisodeModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border-2 border-red-500/50 rounded-lg max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl shadow-red-500/25">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900/50 to-cyan-900/50 border-b border-red-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-mono text-sm">CLASSIFICAÇÃO:</span>
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-mono border border-red-500/50">
                        CONFIDENCIAL
                      </span>
                      <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-mono border border-yellow-500/50">
                        NÍVEL 4
                      </span>
                    </div>
                    <h2 className="text-white font-mono text-lg">RELATÓRIO DE INVESTIGAÇÃO DIGITAL</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEpisodeModal(null)}
                  className="text-gray-400 hover:text-white hover:bg-red-500/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
              {/* Episode Header */}
              <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-mono text-sm">EPISÓDIO {selectedEpisodeModal.id}</span>
                </div>
                <h3 className="text-xl text-white font-mono mb-2">{selectedEpisodeModal.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedEpisodeModal.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    NÍVEL DE AMEAÇA: {selectedEpisodeModal.threat}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    STATUS: {selectedEpisodeModal.status}
                  </div>
                </div>
              </div>

              {/* Investigation Report */}
              <div className="space-y-6">
                <div className="border-l-4 border-red-500 pl-4">
                  <h1 className="text-2xl font-bold text-white mb-4 font-mono">
                    Investigação Digital: Como Quadrilhas Brasileiras Utilizam Tecnologias Avançadas para Golpes
                    Financeiros
                  </h1>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Em 2025, o Brasil enfrenta uma crescente ameaça digital com quadrilhas criminosas cada vez mais
                    sofisticadas. Com um prejuízo estimado de R$ 10 bilhões às vítimas brasileiras em 2024 e um aumento
                    alarmante de 17% nos casos de fraudes digitais em relação a 2023, esta investigação revela como
                    organizações criminosas estão utilizando tecnologias avançadas para executar golpes financeiros e
                    como as autoridades brasileiras estão respondendo a este desafio crescente.
                  </p>
                  <p className="text-cyan-400 font-mono text-sm">por Thiago Rangel</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gray-900/50 border-orange-500/30">
                    <CardHeader>
                      <CardTitle className="text-orange-400 font-mono flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />O Cenário Atual das Fraudes Digitais no Brasil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 text-sm space-y-3">
                      <p>
                        O Brasil testemunha uma transformação preocupante no cenário criminal, onde os crimes virtuais
                        superaram o tráfico de drogas como principal fonte de lucro para facções criminosas organizadas.
                      </p>
                      <p>
                        Estatísticas recentes revelam um quadro alarmante: uma em cada quatro pessoas no país já foi
                        vítima de algum tipo de golpe virtual, criando uma epidemia silenciosa que afeta todas as
                        camadas sociais.
                      </p>
                      <p>
                        O surgimento das chamadas "centrais de golpe" - verdadeiras empresas do crime que operam com
                        infraestrutura tecnológica avançada.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900/50 border-red-500/30">
                    <CardHeader>
                      <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Caso Brodowski: Inteligência Artificial a Serviço do Crime
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-300 text-sm space-y-3">
                      <p>
                        Em fevereiro de 2025, a Polícia Civil do Estado de São Paulo realizou uma operação de alta
                        complexidade que revelou a sofisticação das novas quadrilhas digitais brasileiras.
                      </p>
                      <p>
                        A operação "Código Oculto" resultou no cumprimento de cinco mandados de busca e apreensão,
                        revelando uma quadrilha que movimentava até R$ 200 mil por semana.
                      </p>
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <p className="text-red-300 font-mono text-xs">
                          CLASSIFICADO: Uso de IA Generativa para criação de mensagens personalizadas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-900/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-400 font-mono flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Tecnologias Utilizadas pelos Criminosos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3">
                        <h4 className="text-cyan-400 font-mono text-sm mb-2">Inteligência Artificial Avançada</h4>
                        <p className="text-xs">
                          Modelos de IA generativa para criação de conteúdo fraudulento altamente personalizado,
                          analisando padrões de comunicação.
                        </p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <h4 className="text-red-400 font-mono text-sm mb-2">Malwares Especializados</h4>
                        <p className="text-xs">
                          Grandoreiro, Javali e Lampião - trojans bancários com técnicas de evasão e acesso remoto
                          invisível.
                        </p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                        <h4 className="text-green-400 font-mono text-sm mb-2">Automação Criminal</h4>
                        <p className="text-xs">
                          Robôs digitais programados para executar ataques em escala e simular comportamento humano.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />O Caso Grandoreiro: Golpes Internacionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-3">
                    <p>
                      O caso Grandoreiro representa um marco na evolução das fraudes digitais brasileiras, evidenciando
                      a internacionalização do crime cibernético nacional.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                      <p className="text-yellow-300 font-mono text-xs">
                        OPERAÇÃO: Movimentação fraudulenta de 3,6 milhões de euros (R$ 19,34 milhões)
                      </p>
                      <p className="text-yellow-300 font-mono text-xs">
                        ALCANCE: Espanha, Portugal, Itália, França e Brasil
                      </p>
                      <p className="text-yellow-300 font-mono text-xs">
                        RESULTADO: 43 mandados de busca, 23 prisões preventivas
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 font-mono flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Resposta das Autoridades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-green-400 font-mono text-sm mb-2">Investigação Especializada</h4>
                        <p className="text-xs">
                          Delegacias cibernéticas e laboratórios forenses digitais com técnicas avançadas de
                          rastreamento.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-green-400 font-mono text-sm mb-2">Cooperação Internacional</h4>
                        <p className="text-xs">
                          Canais de comunicação com agências estrangeiras e operações conjuntas transnacionais.
                        </p>
                      </div>
                    </div>
                    <p>
                      A Polícia Federal estabeleceu em 2024 a Diretoria de Crimes Cibernéticos (DCIBER), uma unidade
                      especializada com orçamento próprio.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Impacto Social e Econômico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-3">
                    <p>
                      Os prejuízos financeiros diretos ultrapassaram R$ 10 bilhões em 2024, representando aumento de 17%
                      em relação ao ano anterior.
                    </p>
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                      <p className="text-red-300 font-mono text-xs">
                        "As fraudes digitais representam hoje o maior desafio para a segurança financeira dos
                        brasileiros. O impacto vai muito além do dinheiro perdido - afeta a confiança nas instituições,
                        nas tecnologias e nas próprias relações sociais."
                      </p>
                      <p className="text-red-400 font-mono text-xs mt-2">
                        - Dra. Camila Rodrigues, Coordenadora do Observatório de Crimes Digitais da USP
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Prevenção e Perspectivas Futuras
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-cyan-400 font-mono text-sm mb-2">Propostas Legislativas em Andamento</h4>
                        <ul className="text-xs space-y-1">
                          <li>• PL 4425/2025: Tipifica novos crimes cibernéticos</li>
                          <li>• PL 3887/2025: Responsabilidade civil para plataformas</li>
                          <li>• PL 2743/2024: Fundo nacional para vítimas</li>
                          <li>• PL 5021/2025: Procedimentos investigativos específicos</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-cyan-400 font-mono text-sm mb-2">Medidas Preventivas Recomendadas</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Autenticação multifator em todas as contas</li>
                          <li>• Verificação periódica de extratos bancários</li>
                          <li>• Senhas fortes e gerenciadores confiáveis</li>
                          <li>• Atualização regular de sistemas</li>
                          <li>• Verificação de autenticidade de sites</li>
                        </ul>
                      </div>
                    </div>
                    <p>
                      O programa "Brasil Digital Seguro" já alcançou mais de 15 milhões de brasileiros através de
                      campanhas educativas.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Classification Footer */}
              <div className="border-t border-red-500/30 pt-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <span className="text-red-400">CLASSIFICAÇÃO: CONFIDENCIAL</span>
                    <span className="text-yellow-400">NÍVEL DE ACESSO: 4</span>
                    <span className="text-cyan-400">ORIGEM: CYBERJUSTIÇA BRASIL</span>
                  </div>
                  <div className="text-gray-500">DOCUMENTO GERADO EM: {new Date().toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caso Lulu Modal */}
      {selectedLuluModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border-2 border-red-500/50 rounded-lg max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl shadow-red-500/25">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900/50 to-cyan-900/50 border-b border-red-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-mono text-sm">CLASSIFICAÇÃO:</span>
                      <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-mono border border-red-500/50">
                        CRÍTICO
                      </span>
                      <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-mono border border-yellow-500/50">
                        NÍVEL 5
                      </span>
                    </div>
                    <h2 className="text-white font-mono text-lg">CASO LULU - RELATÓRIO CONFIDENCIAL</h2>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLuluModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-red-500/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
              {/* Case Header */}
              <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-mono text-sm">CASO CRÍTICO - 2023</span>
                </div>
                <h3 className="text-xl text-white font-mono mb-2">Caso Lulu: Uso Indevido de Dados Pessoais em 2023</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    2023
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    NÍVEL DE AMEAÇA: CRÍTICO
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    STATUS: ARQUIVADO
                  </div>
                </div>
              </div>

              {/* Investigation Report */}
              <div className="space-y-6">
                <div className="border-l-4 border-red-500 pl-4">
                  <h1 className="text-2xl font-bold text-white mb-4 font-mono">
                    Caso Lulu: Uso Indevido de Dados Pessoais em 2023
                  </h1>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Em 2023, o Brasil enfrentou um dos maiores escândalos de vazamento e uso indevido de dados pessoais
                    de sua história. O Caso Lulu expôs como criminosos utilizaram informações vazadas para criar um
                    sofisticado esquema de fraudes, afetando centenas de milhares de brasileiros. Este documento analisa
                    o escândalo, seu contexto, impactos, respostas institucionais e lições aprendidas.
                  </p>
                  <p className="text-cyan-400 font-mono text-sm">por Thiago Rangel</p>
                </div>

                <Card className="bg-gray-900/50 border-orange-500/30">
                  <CardHeader>
                    <CardTitle className="text-orange-400 font-mono flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Introdução ao Caso Lulu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-3">
                    <p>
                      O Caso Lulu representa um marco preocupante na história da segurança de dados no Brasil. Emergindo
                      como um dos maiores escândalos de uso indevido de informações pessoais em 2023, o caso revelou
                      vulnerabilidades críticas nos sistemas de proteção de dados utilizados por empresas e instituições
                      brasileiras.
                    </p>
                    <p>
                      O esquema criminoso envolveu a utilização sofisticada de dados pessoais vazados de diversas fontes
                      para criar perfis falsos no aplicativo Lulu, uma plataforma originalmente concebida para
                      avaliações pessoais.
                    </p>
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                      <p className="text-red-300 font-mono text-xs">
                        CLASSIFICADO: Centenas de milhares de brasileiros expostos a fraudes e tentativas de extorsão
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 font-mono flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Vazamentos de Dados: Cenário no Brasil em 2023
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <p>
                      O Caso Lulu não foi um evento isolado, mas parte de um cenário alarmante de vulnerabilidades na
                      segurança digital brasileira. Em 2023, o país registrou um número sem precedentes de 906
                      vazamentos de dados significativos, representando um aumento de aproximadamente 34% em relação ao
                      ano anterior.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <h4 className="text-red-400 font-mono text-sm mb-2">Origem dos Vazamentos</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Ataques direcionados a sistemas vulneráveis</li>
                          <li>• Esquemas de phishing sofisticados</li>
                          <li>• Vulnerabilidades em aplicativos populares</li>
                          <li>• Falhas de configuração em servidores</li>
                        </ul>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3">
                        <h4 className="text-orange-400 font-mono text-sm mb-2">Dados Mais Expostos</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Informações cadastrais completas</li>
                          <li>• Credenciais de acesso online</li>
                          <li>• Históricos de compras e cartões</li>
                          <li>• Registros médicos e planos de saúde</li>
                        </ul>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                        <h4 className="text-purple-400 font-mono text-sm mb-2">Mercado Ilegal</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Bases vendidas por R$500 a R$50.000</li>
                          <li>• Grupos organizados hierárquicos</li>
                          <li>• Uso de criptomoedas</li>
                          <li>• Operação na dark web</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Modus Operandi dos Criminosos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3">
                          <h4 className="text-cyan-400 font-mono text-sm mb-2">1. Aquisição de Dados</h4>
                          <p className="text-xs">
                            Criminosos adquiriam bases vazadas de diversas origens, incluindo vazamentos massivos do
                            Facebook em 2021 e 2022, complementando com dados de outros vazamentos menores.
                          </p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                          <h4 className="text-green-400 font-mono text-sm mb-2">2. Criação de Perfis Falsos</h4>
                          <p className="text-xs">
                            Utilizando informações obtidas, criavam contas falsas no aplicativo Lulu, assumindo
                            identidades de pessoas reais com detalhes convincentes.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                          <h4 className="text-yellow-400 font-mono text-sm mb-2">3. Manipulação Social</h4>
                          <p className="text-xs">
                            Iniciavam interações com outros usuários, publicando avaliações falsas e comentários
                            constrangedores, gerando danos sociais e profissionais.
                          </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                          <h4 className="text-red-400 font-mono text-sm mb-2">4. Extorsão e Fraudes</h4>
                          <p className="text-xs">
                            Contatos diretos com vítimas exigindo pagamentos para remoção de conteúdo ou aplicando
                            golpes financeiros sofisticados.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                      <p className="text-purple-300 font-mono text-xs">
                        TÉCNICA AVANÇADA: Utilização de deepfakes para criar conteúdo comprometedor falso, incluindo
                        áudios, imagens e vídeos manipulados para extorsão e credibilidade.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-red-400 font-mono flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Impactos nas Vítimas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-red-400 font-mono text-sm mb-2">Danos Financeiros</h4>
                        <p className="text-xs mb-2">
                          As perdas financeiras diretas ultrapassaram R$ 220 milhões, segundo levantamento da FEBRABAN.
                          Mais de 430 mil brasileiros foram diretamente afetados pelo esquema.
                        </p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                          <p className="text-red-300 font-mono text-xs italic">
                            "Perdi todas as economias que guardei por cinco anos para a entrada do meu apartamento. O
                            banco inicialmente se recusou a reconhecer a fraude..."
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-orange-400 font-mono text-sm mb-2">Danos Psicológicos</h4>
                        <p className="text-xs mb-2">
                          Aumento de 27% nos casos de transtornos de ansiedade entre vítimas. Casos de Transtorno de
                          Estresse Pós-Traumático foram documentados em vítimas com exposição pública severa.
                        </p>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                          <p className="text-orange-300 font-mono text-xs">
                            ESTATÍSTICA: 42% das vítimas de fraudes financeiras eram idosos, 73% das extorsões
                            envolvendo conteúdo íntimo afetaram mulheres.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-purple-400 font-mono flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Legislação e Jurisprudência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-3">
                    <p>
                      O Caso Lulu tornou-se um divisor de águas na interpretação e aplicação da Lei Geral de Proteção de
                      Dados Pessoais (LGPD) no Brasil, provocando mudanças significativas na jurisprudência.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                        <h4 className="text-blue-400 font-mono text-sm mb-2">Antes do Caso Lulu</h4>
                        <p className="text-xs">
                          STJ entendia que vazamento de dados não gerava dano moral automático, sendo necessária
                          comprovação de prejuízo concreto (REsp 1.758.799).
                        </p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                        <h4 className="text-green-400 font-mono text-sm mb-2">Mudança de Paradigma</h4>
                        <p className="text-xs">
                          Reconhecimento gradual de que vazamento de dados sensíveis constitui violação de direitos da
                          personalidade (REsp 1.895.550 - junho/2023).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 font-mono flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Respostas Institucionais e Ações de Contenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <h4 className="text-red-400 font-mono text-sm mb-2">Ações Judiciais</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Liminar da 12ª Vara Federal Cível/SP</li>
                          <li>• Multa diária de R$ 100.000</li>
                          <li>• Operação "Dados Expostos" da PF</li>
                          <li>• 27 mandados de prisão expedidos</li>
                        </ul>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                        <h4 className="text-blue-400 font-mono text-sm mb-2">Medidas Técnicas</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Resolução CD/ANPD nº 5/2023</li>
                          <li>• Auditorias externas obrigatórias</li>
                          <li>• Plataforma "Dados Seguros"</li>
                          <li>• Novos protocolos FEBRABAN</li>
                        </ul>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                        <h4 className="text-green-400 font-mono text-sm mb-2">Coordenação</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Comitê Interministerial CIRID</li>
                          <li>• 9 ministérios integrados</li>
                          <li>• 14 agências governamentais</li>
                          <li>• Campanha "Proteja Seus Dados"</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Aprendizados e Recomendações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 text-sm space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-cyan-400 font-mono text-sm mb-2">Para Cidadãos</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Usar gerenciadores de senhas</li>
                          <li>• Autenticação de dois fatores</li>
                          <li>• Monitorar atividades financeiras</li>
                          <li>• Limitar compartilhamento online</li>
                          <li>• Verificar vazamentos conhecidos</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-green-400 font-mono text-sm mb-2">Para Empresas</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Política de "dados mínimos"</li>
                          <li>• Auditorias externas regulares</li>
                          <li>• Planos de resposta a incidentes</li>
                          <li>• Treinamento constante de equipes</li>
                          <li>• Segurança por design</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-purple-400 font-mono text-sm mb-2">Para o Poder Público</h4>
                        <ul className="text-xs space-y-1">
                          <li>• Fortalecer a ANPD</li>
                          <li>• Sistema nacional de notificação</li>
                          <li>• Educação digital no currículo</li>
                          <li>• Protocolos interinstitucionais</li>
                          <li>• Cultura de privacidade</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3 mt-4">
                      <p className="text-cyan-300 font-mono text-xs">
                        CONCLUSÃO: O Caso Lulu demonstrou que a proteção de dados transcende questões técnicas,
                        constituindo um desafio cultural e educacional que demanda esforços consistentes de educação
                        digital em todos os níveis da sociedade.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Classification Footer */}
              <div className="border-t border-red-500/30 pt-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-4">
                    <span className="text-red-400">CLASSIFICAÇÃO: CRÍTICO</span>
                    <span className="text-yellow-400">NÍVEL DE ACESSO: 5</span>
                    <span className="text-cyan-400">ORIGEM: CYBERJUSTIÇA BRASIL</span>
                  </div>
                  <div className="text-gray-500">DOCUMENTO GERADO EM: {new Date().toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-black border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
            <CardContent className="p-0">
              <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-400 text-sm ml-4 font-mono">cyberjustica://terminal/v3.2.1</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-green-400 mb-2">
                  <span className="text-cyan-400">admin@cyberjustica:~$</span> system.status()
                </div>
                <div className="text-gray-300 mb-4">
                  <div>
                    {">"} Inicializando protocolos de investigação... <span className="text-green-400">[OK]</span>
                  </div>
                  <div>
                    {">"} Carregando base de dados de crimes... <span className="text-green-400">[OK]</span>
                  </div>
                  <div>
                    {">"} Estabelecendo conexão com especialistas... <span className="text-green-400">[OK]</span>
                  </div>
                  <div>
                    {">"} Calibrando sistemas de proteção... <span className="text-yellow-400">[PENDENTE]</span>
                  </div>
                </div>
                <div className="text-cyan-400 mb-2">
                  <span className="text-cyan-400">admin@cyberjustica:~$</span> podcast.listen()
                </div>
                <div className="text-purple-400">Conexão estabelecida. Bem-vindo ao CyberJustiça Brasil.</div>
                <div className="text-red-400 mt-2">AVISO: Mantenha-se sempre vigilante no mundo digital.</div>
                <div className="text-cyan-400 mt-4 animate-pulse">
                  <span className="text-cyan-400">admin@cyberjustica:~$</span>{" "}
                  <span className="bg-cyan-400 w-2 h-4 inline-block ml-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cyberpunk Audio Player */}
      {currentEpisode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-cyan-500/30">
          <div className="container mx-auto px-6 py-4">
            {/* Compact Player */}
            {!isPlayerExpanded && (
              <div className="flex items-center gap-4">
                {/* Episode Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-mono text-sm truncate">
                      EP {currentEpisode.id}: {currentEpisode.title}
                      {!currentEpisode.audioUrl && <span className="text-yellow-400 ml-2">[DEMO]</span>}
                    </div>
                    <div className="text-gray-400 text-xs font-mono">CyberJustiça Brasil</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                    onClick={() => handleSeek(Math.max(0, currentTime - 15))}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 w-10 h-10 rounded-full"
                    onClick={togglePlayPause}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                    onClick={() => handleSeek(Math.min(duration, currentTime + 15))}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-xs text-gray-400 font-mono">{formatTime(currentTime)}</span>
                  <div
                    className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const percentage = x / rect.width
                      const newTime = percentage * duration
                      handleSeek(newTime)
                    }}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{formatTime(duration)}</span>
                </div>

                {/* Volume & Expand */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsPlayerExpanded(true)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Expanded Player */}
            {isPlayerExpanded && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-cyan-600 rounded-lg flex items-center justify-center">
                      <Radio className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-xl text-white font-mono">
                        EP {currentEpisode.id}: {currentEpisode.title}
                      </div>
                      <div className="text-gray-400 font-mono">CyberJustiça Brasil • {currentEpisode.date}</div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsPlayerExpanded(false)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Waveform Visualization */}
                <div className="relative h-20 bg-gray-900/50 rounded-lg overflow-hidden border border-cyan-500/30">
                  <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
                    {[...Array(50)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 bg-gradient-to-t from-cyan-400 to-red-500 rounded-full transition-all duration-300 ${
                          isPlaying ? "animate-pulse" : ""
                        }`}
                        style={{
                          height: `${20 + Math.random() * 60}%`,
                          animationDelay: `${i * 0.1}s`,
                          opacity: i < (currentTime / duration) * 50 ? 1 : 0.3,
                        }}
                      />
                    ))}
                  </div>

                  {/* Progress Overlay */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500/20 to-red-500/20 transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="ghost"
                    className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                    onClick={() => handleSeek(Math.max(0, currentTime - 15))}
                  >
                    <SkipBack className="w-6 h-6" />
                    <span className="ml-2 font-mono text-sm">-15s</span>
                  </Button>

                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-cyan-600 hover:from-red-400 hover:to-cyan-500 w-16 h-16 rounded-full shadow-lg shadow-red-500/25"
                    onClick={togglePlayPause}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                    onClick={() => handleSeek(Math.min(duration, currentTime + 15))}
                  >
                    <span className="mr-2 font-mono text-sm">+15s</span>
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 font-mono min-w-[3rem]">{formatTime(currentTime)}</span>

                    <div
                      className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const percentage = x / rect.width
                        const newTime = percentage * duration
                        handleSeek(newTime)
                      }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-red-500 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/25"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>

                    <span className="text-sm text-gray-400 font-mono min-w-[3rem]">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <div className="flex items-center gap-2 w-32">
                    <div
                      className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const percentage = x / rect.width
                        setVolume(percentage)
                      }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-cyan-500 rounded-full"
                        style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 font-mono min-w-[2rem]">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>

                {/* Episode Info */}
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`font-mono text-xs ${
                          currentEpisode.threat === "CRÍTICO"
                            ? "bg-red-500/20 text-red-400 border-red-500/50"
                            : currentEpisode.threat === "ALTO"
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                        }`}
                      >
                        {currentEpisode.threat}
                      </Badge>
                      <Badge
                        className={`font-mono text-xs ${
                          currentEpisode.status === "ATIVO"
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : currentEpisode.status === "AGENDADO"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : currentEpisode.status === "RESOLVIDO"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }`}
                      >
                        {currentEpisode.status}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm">{currentEpisode.description}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800 bg-black/50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-red-500 rounded-sm flex items-center justify-center">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-red-500 bg-clip-text text-transparent">
                  CYBERJUSTIÇA BRASIL
                </span>
                <div className="text-xs text-gray-400 font-mono">SISTEMA DE PROTEÇÃO DIGITAL</div>
              </div>
            </div>

            <div className="text-gray-400 text-sm font-mono">
              © 2024 CyberJustiça Brasil. Todos os direitos reservados.
            </div>
          </div>

          <Separator className="my-8 bg-gray-700" />

          <div className="text-center">
            <p className="text-gray-500 text-sm font-mono">
              {">"} "A segurança digital não é um destino, mas uma jornada contínua de vigilância e proteção."
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
