'use client'

import { useEffect, useState } from 'react'

const BIRTHDAY_MONTH = 9 // Ekim
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

function computeParts(
  now: Date,
): Parts {
  const isToday =
    now.getMonth() ===
      BIRTHDAY_MONTH &&
    now.getDate() ===
      BIRTHDAY_DAY

  const target =
    getNextBirthday(now)

  const diff = Math.max(
    0,
    target.getTime() -
      now.getTime(),
  )

  const days = Math.floor(
    diff / 86400000,
  )

  const hours = Math.floor(
    (diff % 86400000) /
      3600000,
  )

  const minutes = Math.floor(
    (diff % 3600000) /
      60000,
  )

  const seconds = Math.floor(
    (diff % 60000) /
      1000,
  )

  return {
    days,
    hours,
    minutes,
    seconds,
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
    <div className="flex min-w-[46px] flex-col items-center sm:min-w-[60px]">
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
      setParts(
        computeParts(new Date()),
      )
    }

    tick()

    const id = setInterval(
      tick,
      1000,
    )

    return () =>
      clearInterval(id)
  }, [])

  if (!parts) return null

  const countdownFinished =
    parts.isToday

  const submitPassword = () => {
    if (password === PASSWORD) {
      setUnlocked(true)
      setError(false)
      return
    }

    setError(true)
    setPassword('')
  }

  return (
    <div className="flex w-full justify-center px-4">
      <div className="w-fit min-w-[290px] rounded-2xl border border-emerald-400/20 bg-black/50 p-4 text-center backdrop-blur-md sm:min-w-[360px] sm:p-5">
        {/* Başlık */}
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px] shadow-emerald-400/60" />

          <p className="text-xs font-medium uppercase tracking-widest text-emerald-100/70">
            Doğum Günü Sayacı
          </p>
        </div>

        {/* Tarih */}
        <p className="mb-4 text-center text-sm font-medium text-emerald-100/60">
          22 Ekim
        </p>

        {/* Sayaç */}
        {countdownFinished ? (
          <p className="py-2 text-lg font-bold text-emerald-300">
            İyi ki doğdun! 🎉
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

        {/* Kilit */}
        <div className="mt-5 border-t border-emerald-400/10 pt-4">
          {!unlocked ? (
            <>
              <div className="mb-2 flex justify-center">
                <span className="text-xl opacity-70">
                  🔒
                </span>
              </div>

              {!countdownFinished ? (
                <p className="text-[10px] uppercase tracking-widest text-emerald-100/30">
                  Sayaç bitince açılır
                </p>
              ) : (
                <>
                  <p className="mb-2 text-xs text-emerald-100/50">
                    Kilidi açmak için şifreyi gir
                  </p>

                  <div className="flex justify-center gap-2">
                    <input
                      value={password}
                      onChange={(e) => {
                        setPassword(
                          e.target.value
                            .replace(
                              /\D/g,
                              '',
                            )
                            .slice(0, 5),
                        )
                        setError(false)
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          'Enter'
                        ) {
                          submitPassword()
                        }
                      }}
                      type="password"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="•••••"
                      className="w-28 rounded-lg border border-emerald-400/20 bg-black/50 px-3 py-2 text-center text-sm tracking-[0.3em] text-emerald-200 outline-none transition focus:border-emerald-400/50"
                    />

                    <button
                      type="button"
                      onClick={
                        submitPassword
                      }
                      className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                    >
                      Aç
                    </button>
                  </div>

                  {error && (
                    <p className="mt-2 text-[10px] text-rose-400">
                      Şifre yanlış.
                    </p>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xl">
                🔓
              </span>

              <p className="mt-1 text-xs font-medium text-emerald-300">
                Kilit açıldı
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
