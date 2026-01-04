export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 400, margin: '100px auto' }}>
      {children}
    </main>
  )
}
