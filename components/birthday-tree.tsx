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

// Gövde hariç bütün dallar söndürülebilir.
const isLightable = (depth: number) => depth >= 1

function BurstGroup({
  burst,
  onDone,
}: {
  burst: Burst
  onDone: (id: number) => void
}) {
  const particles = useMemo(() => {
    const arr = []

    for (let i = 0; i < burst.count; i++) {
      const angle =
        (Math.PI * 2 * i) / burst.count +
        Math.random() * 0.5

      const dist =
        18 +
        Math.random() *
          (burst.count > 16 ? 55 : 30)

      arr.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r:
          1.5 +
          Math.random() *
            (burst.count > 16 ? 3.5 : 2.2),
      })
    }

    return arr
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
            opacity: 1,
            cx: burst.x,
            cy: burst.y,
          }}
          animate={{
            opacity: 0,
            cx: burst.x + p.dx,
            cy: burst.y + p.dy,
          }}
          transition={{
            duration:
              0.75 + Math.random() * 0.25,
            ease: 'easeOut',
          }}
          style={{
            filter: `drop-shadow(0 0 3px ${burst.color})`,
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
  onExtinguish,
}: {
  seg: Segment
  lit: boolean
  onExtinguish: (s: Segment) => void
}) {
  const lightable = isLightable(seg.depth)

  const baseColor =
    seg.depth <= 1
      ? 'url(#trunk)'
      : '#6b4a2b'

  return (
    <g>
      {/* 
        Mobil için dokunma alanı.
        Görünmezdir ve yalnızca kendi dalını yakalar.
      */}
      {lightable && lit && (
        <line
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke="transparent"
          strokeWidth={Math.max(
            seg.width + 14,
            22,
          )}
          strokeLinecap="round"
          pointerEvents="stroke"
          style={{
            cursor: 'pointer',
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onExtinguish(seg)
          }}
        />
      )}

      {/* Görünen dal */}
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
                opacity: [
                  0.85,
                  1,
                  0.85,
                ],
                filter: [
                  'drop-shadow(0 0 3px #f59e0b)',
                  'drop-shadow(0 0 9px #fbbf24)',
                  'drop-shadow(0 0 3px #f59e0b)',
                ],
              }
            : {
                pathLength: 1,
                opacity: 1,
                filter:
                  'drop-shadow(0 0 0px transparent)',
              }
        }
        transition={
          lightable && lit
            ? {
                pathLength: {
                  delay: seg.delay,
                  duration: 0.6,
                  ease: 'easeOut',
                },
                opacity: {
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                filter: {
                  duration: 1.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
            : {
                pathLength: {
                  delay: seg.delay,
                  duration: 0.6,
                  ease: 'easeOut',
                },
                opacity: 1,
              }
        }
        pointerEvents="none"
      />
    </g>
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
        filter: `drop-shadow(0 0 4px ${heart.color})`,
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
      whileHover={{
        scale: heart.size * 1.35,
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

  const totalHearts = hearts.length

  const lightBranches = useMemo(
    () =>
      segments.filter((s) =>
        isLightable(s.depth),
      ),
    [segments],
  )

  const totalLights = lightBranches.length

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
    count = 12,
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
        (b) => b.id !== id,
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
      10,
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
      12,
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
        30,
      )

      spawnBurst(
        400,
        300,
        '#34d399',
        24,
      )

      spawnBurst(
        400,
        300,
        '#fb7185',
        20,
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
    totalHearts -
      popped.size ===
      0

  return (
    <main
      className="relative min-h-svh w-full overflow-hidden bg-black"
      style={{
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
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
        viewBox="0 0 800 600"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMax meet"
        role="img"
        aria-label="Işıklı dalları olan doğum günü ağacı"
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

        {/* Ağaç dalları */}
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
            onExtinguish={
              extinguishBranch
            }
          />
        ))}

        {/* Kalpler */}
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

        {/* Büyük kalp */}
        <AnimatePresence>
          {bigPhase === 'flying' && (
            <motion.g
              style={{
                x: 400,
                filter:
                  'drop-shadow(0 0 16px #f43f5e)',
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
                opacity: 0.9,
              }}
              animate={{
                r: 260,
                opacity: 0,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
              pointerEvents="none"
            />
          )}
        </AnimatePresence>

        {/* Patlama parçacıkları */}
        {bursts.map((burst) => (
          <BurstGroup
            key={burst.id}
            burst={burst}
            onDone={removeBurst}
          />
        ))}
      </svg>

      {/* Üst yazı */}
      <AnimatePresence>
        {!lightsOut && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-6 z-10 w-[94%] -translate-x-1/2 text-center sm:top-10"
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

      {/* Sayaç */}
      <motion.div
        className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6"
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
          duration: 0.6,
        }}
      >
        <Countdown />
      </motion.div>

      {/* Kalp avı */}
      <motion.div
        className="absolute left-4 bottom-20 z-10 w-[170px] sm:left-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[210px]"
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
          duration: 0.6,
        }}
      >
        <div className="rounded-2xl border border-rose-400/20 bg-black/40 p-4 backdrop-blur-md sm:p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_2px] shadow-rose-400/60" />

            <p className="text-xs font-medium uppercase tracking-widest text-rose-100/70">
              Kalp Avı
            </p>
          </div>

          <p className="mb-3 text-sm text-rose-100/50">
            Ağaçtaki kalpleri patlat!
          </p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold tabular-nums text-rose-300 sm:text-4xl">
                {popped.size}
              </p>

              <p className="text-[10px] uppercase tracking-widest text-rose-100/50">
                Patlatılan
              </p>
            </div>

            <p className="text-sm text-rose-100/40 tabular-nums">
              / {totalHearts}
            </p>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-rose-400"
              animate={{
                width: `${
                  totalHearts > 0
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
                className="mt-3 text-sm font-semibold text-emerald-300"
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
