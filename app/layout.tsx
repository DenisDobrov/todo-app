import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "SOLUTER AI",
  description:
    "SOLUTER AI helps professionals transition into AI careers through structured roadmaps, practical projects, and guided learning.",
  keywords: [
    "AI careers",
    "AI education",
    "career transition",
    "machine learning learning path",
    "AI roadmap",
    "edtech",
    "SOLUTER AI",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
