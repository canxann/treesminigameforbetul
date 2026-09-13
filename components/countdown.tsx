'use client'

import { useEffect, useState } from 'react'

const BIRTHDAY_MONTH = 9 // October, 0-indexed
const BIRTHDAY_DAY = 22
const PASSWORD = '09284'

type Parts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  isToday: boolean
}

function getNextBirthday(now: Date) {
  const year = now.getFullYear()

  let target = new Date(
    year,
    BIRTHDAY_MONTH,
    BIRTHDAY_DAY,
    0,
    0,
    0,
    0,
  )

  const todayStart = new Date(
    year,
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  )

  if (target < todayStart) {
    target = new Date(
      year + 1,
      BIRTHDAY_MONTH,
      BIRTHDAY_DAY,
      0,
      0,
      0,
      0,
    )
  }

  return target
}

function computeParts(now: Date): Parts {
  const isToday =
    now.getMonth() === BIRTHDAY_MONTH &&
    now.getDate() === BIRTHDAY_DAY

  const target = getNextBirthday(now)

  const diff = Math.max(
    0,
    target.getTime() - now.getTime(),
  )

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(
      (diff % 86400000) / 3600000,
    ),
    minutes: Math.floor(
      (diff % 3600000) / 60000,
    ),
    seconds: Math.floor(
      (diff % 60000) / 1000,
    ),
    isToday,
  }
}

function Unit({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div className="flex min-w-[45px] flex-col items-center sm:min-w-[55px]">
      <span className="tabular-nums text-2xl font-bold text-emerald-300 sm:text-3xl">
        {String(value).padStart(2, '0')}
      </span>

      <span className="text-[10px] uppercase tracking-widest text-emerald-100/60 sm:text-xs">
        {label}
      </span>
    </div>
  )
}

export default function Countdown() {
  const [parts, setParts] =
    useState<Parts | null>(null)

  const [password, setPassword] =
    useState('')

  const [unlocked, setUnlocked] =
    useState(false)

  const [error, setError] =
    useState(false)

  useEffect(() => {
    const tick = () => {
      setParts(computeParts(new Date()))
    }

    tick()

    const id = setInterval(tick, 1000)

    return () => clearInterval(id)
  }, [])

  if (!parts) return null

  const handleUnlock = () => {
    if (password === PASSWORD) {
      setUnlocked(true)
      setError(false)
      return
    }

    setError(true)
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4 backdrop-blur-md sm:p-5">

        {/* KİLİT */}
        <div className="mb-2 flex justify-center">
          <div
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full',
              'border border-emerald-400/20 bg-emerald-400/5',
              unlocked
                ? 'text-emerald-200'
                : 'text-emerald-300',
            ].join(' ')}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
              />

              <path
                d={
                  unlocked
                    ? 'M8 10V7a4 4 0 0 1 7.5-2'
                    : 'M8 10V7a4 4 0 0 1 8 0v3'
                }
              />

              <circle
                cx="12"
                cy="15"
                r="1"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* BAŞLIK */}
        <p className="mb-1 text-sm font-medium text-emerald-200/80">
          {unlocked
            ? 'Kilit açıldı'
            : 'Gün gelince açılacak'}
        </p>

        {/* TARİH */}
        <p className="mb-3 text-sm text-emerald-100/50">
          22 Ekim
        </p>

        {/* SAYAÇ */}
        {parts.isToday ? (
          <p className="py-2 text-lg font-bold text-emerald-300">
            Gün geldi! 🎉
          </p>
        ) : (
          <div className="flex items-start justify-center gap-2 sm:gap-4">
            <Unit
              value={parts.days}
              label="Gün"
            />

            <span className="pt-1 text-2xl text-emerald-400/40 sm:text-3xl">
              :
            </span>

            <Unit
              value={parts.hours}
              label="Saat"
            />

            <span className="pt-1 text-2xl text-emerald-400/40 sm:text-3xl">
              :
            </span>

            <Unit
              value={parts.minutes}
              label="Dk"
            />

            <span className="pt-1 text-2xl text-emerald-400/40 sm:text-3xl">
              :
            </span>

            <Unit
              value={parts.seconds}
              label="Sn"
            />
          </div>
        )}

        {/* ŞİFRE */}
        {parts.isToday && !unlocked && (
          <div className="mt-5 border-t border-emerald-400/10 pt-4">
            <p className="mb-2 text-xs text-emerald-100/50">
              Kilidi açmak için şifreyi gir
            </p>

            <div className="flex justify-center gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                value={password}
                onChange={(e) => {
                  setPassword(
                    e.target.value.replace(
                      /\D/g,
                      '',
                    ),
                  )

                  setError(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnlock()
                  }
                }}
                placeholder="•••••"
                className="h-10 w-28 rounded-lg border border-emerald-400/20 bg-black/50 px-3 text-center text-sm tracking-[0.3em] text-emerald-200 outline-none transition placeholder:text-emerald-100/20 focus:border-emerald-400/50"
              />

              <button
                type="button"
                onClick={handleUnlock}
                className="h-10 rounded-lg bg-emerald-500/15 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 active:scale-95"
              >
                Aç
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-rose-400">
                Şifre yanlış.
              </p>
            )}
          </div>
        )}

        {/* ŞİFRE DOĞRUYSA SADECE DURUM MESAJI */}
        {parts.isToday && unlocked && (
          <div className="mt-4 border-t border-emerald-400/10 pt-3">
            <p className="text-xs font-medium text-emerald-300">
              🔓 Kilit açıldı
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
