export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f0f3f9] dark:bg-[#02020a] selection:bg-purple-500/30 selection:text-white transition-colors duration-300">
      {children}
    </main>
  )
}
