import { ImageResponse } from "next/og"

export const alt = "CyberJustiça Brasil - Investigação de Crimes Cibernéticos"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            fontFamily: "monospace",
            color: "#22d3ee",
            marginBottom: 24,
          }}
        >
          CyberJustiça Brasil
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#d1d5db",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Investigação de Crimes Cibernéticos
        </div>
      </div>
    ),
    { ...size }
  )
}
