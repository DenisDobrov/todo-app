import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "SOLUTER AI",
  description: "Education platform for people transitioning into AI careers",
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