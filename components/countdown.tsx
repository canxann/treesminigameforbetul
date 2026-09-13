'use client'

import { useEffect, useState } from 'react'

// Birthday: 22 October.
const BIRTHDAY_MONTH = 9 // 0-indexed -> October
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

  const days = Math.floor(
    diff / 86400000,
  )

  const hours = Math.floor(
    (diff % 86400000) / 3600000,
  )

  const minutes = Math.floor(
    (diff % 3600000) / 60000,
  )

  const seconds = Math.floor(
    (diff % 60000) / 1000,
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
    <div className="flex flex-col items-center">
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

  const [passwordOpen, setPasswordOpen] =
    useState(false)

  const [password, setPassword] =
    useState('')

  const [unlocked, setUnlocked] =
    useState(false)

  const [wrongPassword, setWrongPassword] =
    useState(false)

  useEffect(() => {
    const tick = () =>
      setParts(computeParts(new Date()))

    tick()

    const id = setInterval(
      tick,
      1000,
    )

    return () => clearInterval(id)
  }, [])

  if (!parts) return null

  const handleUnlock = () => {
    if (password === PASSWORD) {
      setUnlocked(true)
      setWrongPassword(false)
      setPasswordOpen(false)
      setPassword('')
      return
    }

    setWrongPassword(true)
  }

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4 text-center backdrop-blur-md sm:p-5">
      {/* BAŞLIK */}
      <div className="mb-1 flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px] shadow-emerald-400/60" />

        <p className="text-xs font-medium uppercase tracking-widest text-emerald-100/70">
          Doğum Günü Sayacı
        </p>
      </div>

      {/* TARİH */}
      <p className="mb-4 text-sm text-emerald-100/50">
        22 Ekim
      </p>

      {/* SAYAÇ */}
      {parts.isToday ? (
        <p className="py-2 text-lg font-bold text-emerald-300">
          İyi ki doğdun! 🎉
        </p>
      ) : (
        <div className="flex items-start justify-center gap-3 sm:gap-4">
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

      {/* KİLİT */}
      <div className="mt-4 border-t border-emerald-400/10 pt-3">
        <button
          type="button"
          disabled={!parts.isToday}
          onClick={() =>
            setPasswordOpen(
              (value) => !value,
            )
          }
          className={[
            'mx-auto flex items-center justify-center',
            'transition-all duration-300',
            parts.isToday
              ? 'cursor-pointer text-emerald-300 hover:scale-110 hover:text-emerald-200'
              : 'cursor-not-allowed text-emerald-100/25',
          ].join(' ')}
          aria-label={
            parts.isToday
              ? 'Kilidi aç'
              : 'Sayaç bitene kadar kilitli'
          }
        >
          <span
            className={[
              'text-xl transition-all duration-300',
              parts.isToday &&
                'drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]',
            ].join(' ')}
          >
            {unlocked ? '🔓' : '🔒'}
          </span>
        </button>

        {/* ŞİFRE ALANI */}
        {passwordOpen &&
          !unlocked &&
          parts.isToday && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="flex w-full max-w-[190px] gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={5}
                  value={password}
                  autoFocus
                  onChange={(e) => {
                    setPassword(
                      e.target.value.replace(
                        /\D/g,
                        '',
                      ),
                    )

                    setWrongPassword(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnlock()
                    }
                  }}
                  placeholder="Şifre"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-emerald-400/20 bg-black/50 px-3 text-center text-sm tracking-[0.3em] text-emerald-200 outline-none placeholder:text-emerald-100/30 focus:border-emerald-400/50"
                />

                <button
                  type="button"
                  onClick={handleUnlock}
                  className="h-9 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  Aç
                </button>
              </div>

              {wrongPassword && (
                <p className="text-[10px] text-rose-400">
                  Şifre yanlış.
                </p>
              )}
            </div>
          )}

        {/* AÇILDI */}
        {unlocked && (
          <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-emerald-300/70">
            Kilit açıldı ✨
          </p>
        )}
      </div>
    </div>
  )
}
