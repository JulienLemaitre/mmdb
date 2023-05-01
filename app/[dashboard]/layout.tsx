import '../globals.css'

export const metadata = {
  title: 'Metronome Mark Database',
  description: 'Collection of published metronome marks gathered to statistical analysis on tempo usage.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
