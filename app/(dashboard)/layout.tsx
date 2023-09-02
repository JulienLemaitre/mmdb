import '@/styles/globals.css'

export default function DashboardRootLayout({children}) {
  return (
    <body className="h-screen w-screen p-6">
    <div className="w-full h-full">
      {children}
    </div>
    <div id="modal"></div>
    </body>
  )
}