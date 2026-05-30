import type { NextConfig } from "next";

// Vercel injecte automatiquement VERCEL_PROJECT_PRODUCTION_URL (URL stable du projet)
// et VERCEL_URL (URL unique du déploiement en cours).
// On privilégie dans cet ordre :
//   1. NEXT_PUBLIC_APP_URL (si défini manuellement dans Vercel)
//   2. VERCEL_PROJECT_PRODUCTION_URL (URL stable : deep-night.vercel.app)
//   3. VERCEL_URL (URL du déploiement courant)
//   4. localhost en dev
function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: getAppUrl(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig;
