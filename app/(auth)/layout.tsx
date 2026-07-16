export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#02020a] selection:bg-purple-500/30 selection:text-white">
      {children}
    </main>
  )
}
