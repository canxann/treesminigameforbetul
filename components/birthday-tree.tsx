'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  generateTree,
  HEART_PATH,
  type HeartData,
  type Segment,
} from '@/lib/tree'
import Countdown from '@/components/countdown'

type Burst = {
  id: number
  x: number
  y: number
  color: string
  count: number
}

let burstSeq = 0

// Sadece 14 dal ışıklı olacak:
// depth 1 = 2
// depth 2 = 4
// depth 3 = 8
// toplam = 14
const isLightable = (depth: number) =>
  depth >= 1 && depth <= 3

function BurstGroup({
  burst,
  onDone,
}: {
  burst: Burst
  onDone: (id: number) => void
}) {
  const particles = useMemo(() => {
    return Array.from(
      { length: burst.count },
      (_, i) => {
        const angle =
          (Math.PI * 2 * i) / burst.count +
          Math.random() * 0.35

        const dist =
          16 +
          Math.random() *
            (burst.count > 16 ? 45 : 25)

        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          r:
            1.2 +
            Math.random() *
              (burst.count > 16 ? 2.8 : 1.8),
        }
      },
    )
  }, [burst])

  return (
    <g pointerEvents="none">
      {particles.map((p, i) => (
        <motion.circle
          key={i}
          cx={burst.x}
          cy={burst.y}
          r={p.r}
          fill={burst.color}
          initial={{
            opacity: 0.9,
            cx: burst.x,
            cy: burst.y,
          }}
          animate={{
            opacity: 0,
            cx: burst.x + p.dx,
            cy: burst.y + p.dy,
          }}
          transition={{
            duration: 0.55 + Math.random() * 0.2,
            ease: 'easeOut',
          }}
          onAnimationComplete={
            i === 0
              ? () => onDone(burst.id)
              : undefined
          }
        />
      ))}
    </g>
  )
}

function Branch({
  seg,
  lit,
}: {
  seg: Segment
  lit: boolean
}) {
  const lightable = isLightable(seg.depth)

  const baseColor =
    seg.depth <= 1
      ? 'url(#trunk)'
      : '#6b4a2b'

  return (
    <motion.line
      x1={seg.x1}
      y1={seg.y1}
      x2={seg.x2}
      y2={seg.y2}
      stroke={
        lightable && lit
          ? '#fbbf24'
          : baseColor
      }
      strokeWidth={seg.width}
      strokeLinecap="round"
      initial={{
        pathLength: 0,
        opacity: 0,
      }}
      animate={
        lightable && lit
          ? {
              pathLength: 1,
              opacity: [0.72, 1, 0.72],
            }
          : {
              pathLength: 1,
              opacity: 1,
            }
      }
      transition={
        lightable && lit
          ? {
              pathLength: {
                delay: seg.delay,
                duration: 0.4,
                ease: 'easeOut',
              },
              opacity: {
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : {
              pathLength: {
                delay: seg.delay,
                duration: 0.4,
                ease: 'easeOut',
              },
              opacity: {
                duration: 0.2,
              },
            }
      }
      pointerEvents="none"
    />
  )
}

function Heart({
  heart,
  onPop,
}: {
  heart: HeartData
  onPop: (h: HeartData) => void
}) {
  return (
    <motion.g
      style={{
        x: heart.x,
        y: heart.y,
        cursor: 'pointer',
        touchAction: 'none',
      }}
      initial={{
        scale: 0,
        opacity: 0,
      }}
      animate={{
        scale: heart.size,
        opacity: 1,
      }}
      whileTap={{
        scale: heart.size * 0.5,
      }}
      transition={{
        delay: heart.delay,
        type: 'spring',
        stiffness: 220,
        damping: 12,
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onPop(heart)
      }}
    >
      <path
        d={HEART_PATH}
        fill={heart.color}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={0.4}
      />
    </motion.g>
  )
}

export default function BirthdayTree() {
  const { segments, hearts } = useMemo(
    () => generateTree(7),
    [],
  )

  // Tam olarak 14 ışıklı dal.
  const lightBranches = useMemo(
    () =>
      segments.filter((segment) =>
        isLightable(segment.depth),
      ),
    [segments],
  )

  const totalLights = lightBranches.length
  const totalHearts = hearts.length

  const [extinguished, setExtinguished] =
    useState<Set<number>>(new Set())

  const [popped, setPopped] =
    useState<Set<number>>(new Set())

  const [bursts, setBursts] =
    useState<Burst[]>([])

  const [heartsActive, setHeartsActive] =
    useState(false)

  const [bigPhase, setBigPhase] =
    useState<
      'hidden' | 'flying' | 'gone'
    >('hidden')

  const [flash, setFlash] =
    useState(false)

  const [uiVisible, setUiVisible] =
    useState(false)

  const spawnBurst = (
    x: number,
    y: number,
    color: string,
    count = 8,
  ) => {
    const burst: Burst = {
      id: burstSeq++,
      x,
      y,
      color,
      count,
    }

    setBursts((prev) => [
      ...prev,
      burst,
    ])
  }

  const removeBurst = (id: number) => {
    setBursts((prev) =>
      prev.filter(
        (burst) => burst.id !== id,
      ),
    )
  }

  const extinguishBranch = (
    segment: Segment,
  ) => {
    setExtinguished((prev) => {
      if (prev.has(segment.id)) {
        return prev
      }

      const next = new Set(prev)
      next.add(segment.id)

      return next
    })

    spawnBurst(
      (segment.x1 + segment.x2) / 2,
      (segment.y1 + segment.y2) / 2,
      '#fbbf24',
      8,
    )
  }

  const popHeart = (
    heart: HeartData,
  ) => {
    setPopped((prev) => {
      if (prev.has(heart.id)) {
        return prev
      }

      const next = new Set(prev)
      next.add(heart.id)

      return next
    })

    spawnBurst(
      heart.x,
      heart.y,
      heart.color,
      8,
    )
  }

  const lightsOut =
    extinguished.size >= totalLights

  useEffect(() => {
    if (!lightsOut) return

    const timers: ReturnType<
      typeof setTimeout
    >[] = []

    timers.push(
      setTimeout(
        () => setHeartsActive(true),
        350,
      ),
    )

    timers.push(
      setTimeout(
        () => setBigPhase('flying'),
        1700,
      ),
    )

    timers.push(
      setTimeout(
        () => setUiVisible(true),
        3000,
      ),
    )

    return () =>
      timers.forEach(clearTimeout)
  }, [lightsOut])

  const onBigHeartArrived =
    () => {
      setFlash(true)

      spawnBurst(
        400,
        300,
        '#f43f5e',
        18,
      )

      spawnBurst(
        400,
        300,
        '#34d399',
        14,
      )

      spawnBurst(
        400,
        300,
        '#fb7185',
        12,
      )

      setTimeout(
        () => setBigPhase('gone'),
        120,
      )

      setTimeout(
        () => setFlash(false),
        500,
      )
    }

  const allPopped =
    heartsActive &&
    popped.size === totalHearts

  return (
    <main
      className="relative min-h-svh w-full overflow-hidden bg-black"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Arka plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 78%, rgba(16,185,129,0.14), transparent 70%)',
        }}
      />

      <svg
        viewBox="150 20 500 560"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMax slice"
        role="img"
        aria-label="Işıklı doğum günü ağacı"
        style={{
          touchAction: 'none',
        }}
      >
        <defs>
          <linearGradient
            id="trunk"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#8b5e34"
            />
            <stop
              offset="100%"
              stopColor="#5c3d1e"
            />
          </linearGradient>

          <radialGradient
            id="ground"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop
              offset="0%"
              stopColor="rgba(16,185,129,0.35)"
            />
            <stop
              offset="100%"
              stopColor="rgba(16,185,129,0)"
            />
          </radialGradient>
        </defs>

        {/* Zemin */}
        <ellipse
          cx={400}
          cy={565}
          rx={230}
          ry={26}
          fill="url(#ground)"
          pointerEvents="none"
        />

        {/* ================================
            AĞAÇ
            ================================ */}

        {segments.map((segment) => (
          <Branch
            key={segment.id}
            seg={segment}
            lit={
              isLightable(
                segment.depth,
              ) &&
              !extinguished.has(
                segment.id,
              )
            }
          />
        ))}

        {/* ================================
            TELEFON HITBOX'LARI
            SADECE 14 TANE
            ================================ */}

        <g
          style={{
            touchAction: 'none',
          }}
        >
          {lightBranches.map(
            (segment) => {
              if (
                extinguished.has(
                  segment.id,
                )
              ) {
                return null
              }

              const x =
                (segment.x1 +
                  segment.x2) /
                2

              const y =
                (segment.y1 +
                  segment.y2) /
                2

              return (
                <circle
                  key={`hit-${segment.id}`}
                  cx={x}
                  cy={y}
                  r={26}
                  fill="transparent"
                  stroke="transparent"
                  pointerEvents="all"
                  style={{
                    touchAction: 'none',
                    cursor: 'pointer',
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    extinguishBranch(
                      segment,
                    )
                  }}
                />
              )
            },
          )}
        </g>

        {/* ================================
            KALPLER
            ================================ */}

        {heartsActive &&
          hearts.map(
            (heart) =>
              !popped.has(
                heart.id,
              ) && (
                <Heart
                  key={heart.id}
                  heart={heart}
                  onPop={popHeart}
                />
              ),
          )}

        {/* ================================
            BÜYÜK KALP
            ================================ */}

        <AnimatePresence>
          {bigPhase === 'flying' && (
            <motion.g
              style={{
                x: 400,
              }}
              initial={{
                y: 660,
                scale: 0.3,
                opacity: 0,
              }}
              animate={{
                y: 300,
                scale: 6.5,
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.9,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              onAnimationComplete={
                onBigHeartArrived
              }
            >
              <path
                d={HEART_PATH}
                fill="#f43f5e"
                stroke="#fecdd3"
                strokeWidth={0.5}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Flash */}
        <AnimatePresence>
          {flash && (
            <motion.circle
              cx={400}
              cy={300}
              fill="#ffffff"
              initial={{
                r: 0,
                opacity: 0.8,
              }}
              animate={{
                r: 240,
                opacity: 0,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.45,
                ease: 'easeOut',
              }}
              pointerEvents="none"
            />
          )}
        </AnimatePresence>

        {/* Patlamalar */}
        {bursts.map((burst) => (
          <BurstGroup
            key={burst.id}
            burst={burst}
            onDone={removeBurst}
          />
        ))}
      </svg>

      {/* ================================
          ÜST YAZI
          ================================ */}

      <AnimatePresence>
        {!lightsOut && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-5 z-30 w-[94%] -translate-x-1/2 text-center"
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
          >
            <p className="text-base font-semibold tracking-wide text-amber-200 sm:text-xl">
              Işıyan dallara dokun ve söndür Betül
            </p>

            <p className="mt-1 text-xs uppercase tracking-widest text-amber-100/50 tabular-nums">
              {Math.max(
                totalLights -
                  extinguished.size,
                0,
              )}{' '}
              dal kaldı
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================
          SOL ÜST - COUNTDOWN
          ================================ */}

      <motion.div
        className="absolute left-3 top-3 z-40 sm:left-6 sm:top-6"
        initial={{
          opacity: 0,
          x: -20,
        }}
        animate={
          uiVisible
            ? {
                opacity: 1,
                x: 0,
              }
            : {}
        }
        transition={{
          duration: 0.5,
        }}
      >
        <Countdown />
      </motion.div>

      {/* ================================
          SAĞ ÜST - KALP AVI
          ================================ */}

      <motion.div
        className="absolute right-3 top-3 z-40 w-[165px] sm:right-6 sm:top-6 sm:w-[210px]"
        initial={{
          opacity: 0,
          x: 20,
        }}
        animate={
          uiVisible
            ? {
                opacity: 1,
                x: 0,
              }
            : {}
        }
        transition={{
          duration: 0.5,
        }}
      >
        <div className="rounded-2xl border border-rose-400/20 bg-black/45 p-3 backdrop-blur-md sm:p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400" />

            <p className="text-xs font-medium uppercase tracking-widest text-rose-100/70">
              Kalp Avı
            </p>
          </div>

          <p className="mb-2 text-xs text-rose-100/50 sm:mb-3 sm:text-sm">
            Ağaçtaki kalpleri patlat!
          </p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums text-rose-300 sm:text-4xl">
                {popped.size}
              </p>

              <p className="text-[9px] uppercase tracking-widest text-rose-100/50 sm:text-[10px]">
                Patlatılan
              </p>
            </div>

            <p className="text-xs text-rose-100/40 tabular-nums sm:text-sm">
              / {totalHearts}
            </p>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10 sm:mt-3">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-rose-400"
              animate={{
                width: `${
                  totalHearts
                    ? (popped.size /
                        totalHearts) *
                      100
                    : 0
                }%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            />
          </div>

          <AnimatePresence>
            {allPopped && (
              <motion.p
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-2 text-xs font-semibold text-emerald-300 sm:mt-3 sm:text-sm"
              >
                Hepsini patlattın!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  )
}
