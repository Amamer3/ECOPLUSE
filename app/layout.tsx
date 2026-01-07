import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { LoadingProvider } from "@/hooks/use-loading"
import { LoadingConsumer } from "@/components/loading-consumer"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Economic Analysis Dashboard",
  description: "Real-time economic indicators and AI analysis",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <div className="flex h-14 sm:h-16 items-center border-b px-4 sm:px-6">
                  <SidebarTrigger className="-ml-1 mr-4" />
                  <div className="h-4 w-px bg-border mr-4" />
                  <h1 className="text-sm font-medium text-muted-foreground">Economic Analysis Dashboard</h1>
                  <div className="ml-auto">
                    <ModeToggle />
                  </div>
                </div>
                <div className="p-4 sm:p-6">{children}</div>
              </main>
            </div>
          </SidebarProvider>
          <LoadingConsumer />
          <Toaster />
          <Analytics />
          </LoadingProvider>
        </ThemeProvider
        >
      </body>
    </html>
  )
}
