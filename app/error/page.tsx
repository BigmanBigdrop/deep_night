import Link from 'next/link'
import Image from 'next/image'

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  const display =
    message === 'INVITATION_INVALID'
      ? "Ce lien d'invitation est invalide, déjà utilisé ou expiré."
      : message ?? 'Une erreur est survenue.'

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
      <Image src="/logo.jpeg" alt="Deep Night" width={72} height={72} className="rounded-2xl mb-8 opacity-60" />
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <span className="text-red-400 text-xl">✕</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-3">Lien invalide</h1>
      <p className="text-white/40 max-w-sm text-sm">{display}</p>
      <Link
        href="/"
        className="mt-8 text-brand hover:text-brand-light text-sm underline underline-offset-4 transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}
