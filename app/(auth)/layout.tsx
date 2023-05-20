import '@/styles/globals.css'
import GlassPane from "@/components/GlassPane";

export const metadata = {
  title: 'Metronome Mark Database',
  description: 'Collection of published metronome marks gathered to statistical analysis on tempo usage.',
}

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <body className="h-screen w-screen rainbow-mesh p-6">
    <GlassPane
      className="w-full h-full flex items-center justify-center">
      {children}
    </GlassPane>
    </body>
  )
}
