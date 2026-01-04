export default function TestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-serif text-ink">Villa Test Page</h1>
        <p className="text-ink-muted">If you see this with cream background, styling works!</p>
        <button className="bg-accent-yellow text-accent-brown px-6 py-3 rounded-lg font-medium">
          Yellow Button
        </button>
        <div className="min-h-[520px] h-[60vh] max-h-[640px] w-full rounded-lg bg-cream-100 border border-neutral-100 flex items-center justify-center">
          <p className="text-ink-muted">Porto container would go here (520px min height)</p>
        </div>
      </div>
    </main>
  )
}
