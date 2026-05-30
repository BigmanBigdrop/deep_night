'use client'

import { useEffect, useState } from 'react'

const MAPS_URL = 'https://maps.app.goo.gl/h8JfDdge4pTHzVJd7'
// 21h30 heure d'Abidjan = UTC+0
const EVENT_DATE = new Date(Date.UTC(2026, 5, 6, 21, 30, 0))

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeLeft(): TimeLeft {
  const total = EVENT_DATE.getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

type Props = {
  title?: string
  content?: string
}

export default function LocationCard({ title, content }: Props) {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft())
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const isOver = time.total === 0

  return (
    <div className="relative rounded-3xl overflow-hidden bg-black border border-white/8">

      {/* ── Fond animé radar ── */}
      <div className="relative h-64 flex items-center justify-center overflow-hidden">

        {/* Grille de points subtile */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle, #e8bfb8 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Dégradé de masque */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial-from-transparent to-black/80 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }}
        />

        {/* Anneaux radar animés */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="absolute rounded-full border border-brand/40"
              style={{
                width: `${i * 70}px`,
                height: `${i * 70}px`,
                animation: `ping ${1.6 + i * 0.4}s cubic-bezier(0.2,0.6,0.4,1) ${i * 0.3}s infinite`,
                opacity: 1 / i,
              }}
            />
          ))}
        </div>

        {/* Pin central */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="relative">
            {/* Halo */}
            <div className="absolute -inset-3 rounded-full bg-brand/20 blur-md animate-pulse" />
            {/* Icone pin SVG */}
            <div className="relative w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/40">
              <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps de la carte ── */}
      <div className="px-6 pt-5 pb-7 space-y-6">

        {/* Titre + description */}
        <div className="text-center">
          <h2 className="text-white text-xl font-bold tracking-wide mb-1">
            {title ?? 'Lieu de la soirée'}
          </h2>
          <p className="text-brand text-xs tracking-[0.2em] uppercase">
            Samedi 06 Juin 2026 · 21h30
          </p>
          {content && (
            <p className="text-white/55 text-sm leading-relaxed whitespace-pre-wrap mt-3">{content}</p>
          )}
        </div>

        {/* Compte à rebours */}
        {!isOver ? (
          <div>
            <p className="text-white/20 text-xs text-center uppercase tracking-widest mb-3">
              Début dans
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: time.days,    label: 'Jours' },
                { value: time.hours,   label: 'Heures' },
                { value: time.minutes, label: 'Min' },
                { value: time.seconds, label: 'Sec' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center bg-white/5 border border-white/8 rounded-2xl py-3"
                >
                  <span className="text-2xl font-bold text-white tabular-nums leading-none">
                    {pad(value)}
                  </span>
                  <span className="text-white/25 text-xs mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-brand text-lg font-bold animate-pulse">C&apos;est ce soir !</p>
          </div>
        )}

        {/* Bouton navigation */}
        <div className="space-y-2">
          {/* Bouton principal */}
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-brand hover:bg-brand-light text-black font-bold rounded-2xl py-4 transition-colors group"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M21.71 11.29l-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
            </svg>
            <span>M&apos;y emmener</span>
          </a>

          {/* Coordonnées */}
          <p className="text-center text-white/15 text-xs font-mono tracking-wider">
            5.196105° N · 3.744462° W
          </p>
        </div>
      </div>

      {/* Keyframes injectés inline */}
      <style>{`
        @keyframes ping {
          0%   { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>
    </div>
  )
}
