"use client"

import * as React from "react"

export type TextSize = "default" | "large" | "xlarge"

const FONT_SIZES = {
  default: "16px",
  large: "18px",
  xlarge: "20px"
}

interface TextSizeContextProps {
  textSize: TextSize
  setTextSize: (size: TextSize) => void
}

const TextSizeContext = React.createContext<TextSizeContextProps | undefined>(undefined)

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSize] = React.useState<TextSize>("default")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem("app-text-size") as TextSize
      if (saved && FONT_SIZES[saved]) {
        setTextSize(saved)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const root = window.document.documentElement
    root.style.fontSize = FONT_SIZES[textSize]
    try {
      localStorage.setItem("app-text-size", textSize)
    } catch {}
  }, [textSize, mounted])

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  const context = React.useContext(TextSizeContext)
  if (context === undefined) {
    throw new Error("useTextSize must be used within a TextSizeProvider")
  }
  return context
}
