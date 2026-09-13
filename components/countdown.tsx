'use client'

import { useEffect, useState } from 'react'

// Birthday: 22 October.
const BIRTHDAY_MONTH = 9 // 0-indexed -> October
const BIRTHDAY_DAY = 22

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

  useEffect(() => {
    const tick = () => {
      setParts(computeParts(new Date()))
    }

    tick()

    const id = setInterval(tick, 1000)

    return () => clearInterval(id)
  }, [])

  if (!parts) return null

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4 text-center backdrop-blur-md sm:p-5">
      <p className="mb-3 text-sm text-emerald-100/50">
        22 Ekim
      </p>

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
    </div>
  )
}
