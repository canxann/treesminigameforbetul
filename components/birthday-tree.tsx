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

// Depth 1 + 2 + 3 = ışıklı dallar
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
          14 +
          Math.random() *
            (burst.count > 16 ? 42 : 24)

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

  const lightBranches = useMemo(
    () =>
      segments.filter((segment) =>
        isLightable(segment.depth),
      ),
    [segments],
  )

  const totalLights =
    lightBranches.length

  const totalHearts =
    hearts.length

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

  const [finale, setFinale] =
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

  const allPopped =
    heartsActive &&
    popped.size >= totalHearts

  // Dallar tamamen sönünce kalpleri göster.
  useEffect(() => {
    if (!lightsOut) return

    const timer = setTimeout(() => {
      setHeartsActive(true)
    }, 350)

    return () => clearTimeout(timer)
  }, [lightsOut])

  // Tüm kalpler bitince büyük kalbi başlat.
  useEffect(() => {
    if (!allPopped) return
    if (bigPhase !== 'hidden') return

    const timer = setTimeout(() => {
      setBigPhase('flying')
    }, 500)

    return () => clearTimeout(timer)
  }, [allPopped, bigPhase])

  // Büyük kalp telefon ekranının ortasına gelince patlar.
  const onBigHeartArrived = () => {
    setFlash(true)

    // Büyük pembe patlama
    spawnBurst(
      400,
      300,
      '#f43f5e',
      32,
    )

    // Yeşil parçacıklar
    spawnBurst(
      400,
      300,
      '#34d399',
      24,
    )

    // Açık pembe parçacıklar
    spawnBurst(
      400,
      300,
      '#fb7185',
      22,
    )

    // Altın parçacıklar
    spawnBurst(
      400,
      300,
      '#fbbf24',
      16,
    )

    setTimeout(() => {
      setBigPhase('gone')
    }, 120)

    setTimeout(() => {
      setFlash(false)
    }, 500)

    // Patlamadan sonra sadece sayaç kalacak.
    setTimeout(() => {
      setFinale(true)
    }, 650)
  }

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

      {/* AĞAÇ + KALPLER */}
      <AnimatePresence>
        {!finale && (
          <motion.svg
            viewBox="155 35 490 525"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMax meet"
            role="img"
            aria-label="Işıklı doğum günü ağacı"
            initial={{
              opacity: 1,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
            }}
            transition={{
              duration: 0.55,
              ease: 'easeOut',
            }}
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

            <ellipse
              cx={400}
              cy={565}
              rx={210}
              ry={24}
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
              />
            ))}

            {/* Telefon için geniş dokunma alanları */}
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

                  return (
                    <line
                      key={`hit-${segment.id}`}
                      x1={segment.x1}
                      y1={segment.y1}
                      x2={segment.x2}
                      y2={segment.y2}
                      stroke="transparent"
                      strokeWidth={Math.max(
                        segment.width + 30,
                        38,
                      )}
                      strokeLinecap="round"
                      fill="none"
                      pointerEvents="stroke"
                      style={{
                        touchAction: 'none',
                        cursor: 'pointer',
                      }}
                      onPointerDown={(
                        e,
                      ) => {
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

            {/* Küçük kalpler */}
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

            {/* SVG içindeki eski büyük kalp
                artık kullanılmıyor. Büyük kalp
                aşağıda fixed olarak çiziliyor. */}

            {/* Final patlama ışığı */}
            <AnimatePresence>
              {flash && (
                <motion.circle
                  cx={400}
                  cy={300}
                  fill="#ffffff"
                  initial={{
                    r: 0,
                    opacity: 0.85,
                  }}
                  animate={{
                    r: 280,
                    opacity: 0,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.55,
                    ease: 'easeOut',
                  }}
                  pointerEvents="none"
                />
              )}
            </AnimatePresence>

            {/* Parçacıklar */}
            {bursts.map(
              (burst) => (
                <BurstGroup
                  key={burst.id}
                  burst={burst}
                  onDone={removeBurst}
                />
              ),
            )}
          </motion.svg>
        )}
      </AnimatePresence>

      {/* BÜYÜK FİNAL KALBİ
          Telefon ekranının gerçek merkezinde */}
      <AnimatePresence>
        {bigPhase === 'flying' && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
          >
            <motion.div
              className="relative flex items-center justify-center"
              initial={{
                scale: 0.15,
                opacity: 0,
                y: 100,
                rotate: -10,
              }}
              animate={{
                scale: [
                  0.15,
                  0.95,
                  1.15,
                  1,
                ],
                opacity: 1,
                y: 0,
                rotate: [
                  -10,
                  5,
                  -2,
                  0,
                ],
              }}
              exit={{
                scale: 2.8,
                opacity: 0,
              }}
              transition={{
                duration: 1,
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
              style={{
                filter:
                  'drop-shadow(0 0 12px rgba(244,63,94,0.95)) drop-shadow(0 0 30px rgba(244,63,94,0.75)) drop-shadow(0 0 70px rgba(244,63,94,0.45))',
              }}
            >
              {/* Kalp parlaması */}
              <motion.div
                className="absolute rounded-full bg-rose-400/30 blur-2xl"
                style={{
                  width: '110px',
                  height: '110px',
                }}
                animate={{
                  scale: [
                    0.8,
                    1.25,
                    0.9,
                  ],
                  opacity: [
                    0.35,
                    0.7,
                    0.35,
                  ],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <svg
                width="170"
                height="170"
                viewBox="0 0 100 100"
                className="relative overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="bigHeartGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#fb7185"
                    />

                    <stop
                      offset="45%"
                      stopColor="#f43f5e"
                    />

                    <stop
                      offset="100%"
                      stopColor="#be123c"
                    />
                  </linearGradient>
                </defs>

                <path
                  d={HEART_PATH}
                  fill="url(#bigHeartGradient)"
                  stroke="#fecdd3"
                  strokeWidth="0.9"
                />

                {/* Kalp üzerindeki parlak çizgi */}
                <path
                  d={HEART_PATH}
                  fill="none"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="0.5"
                  opacity="0.8"
                />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÜST YAZI */}
      <AnimatePresence>
        {!lightsOut &&
          !finale && (
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

      {/* KALP AVI */}
      <AnimatePresence>
        {!finale && (
          <motion.div
            className="absolute right-2 top-2 z-40 w-[135px] sm:right-6 sm:top-6 sm:w-[190px]"
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: heartsActive ? 1 : 0,
              x: heartsActive ? 0 : 20,
            }}
            exit={{
              opacity: 0,
              x: 20,
              scale: 0.9,
            }}
            transition={{
              duration: 0.4,
            }}
          >
            <div className="rounded-xl border border-rose-400/20 bg-black/45 p-2.5 backdrop-blur-md sm:rounded-2xl sm:p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 sm:h-2 sm:w-2" />

                <p className="text-[9px] font-medium uppercase tracking-widest text-rose-100/70 sm:text-xs">
                  Kalp Avı
                </p>
              </div>

              <p className="mb-2 text-[10px] text-rose-100/50 sm:mb-3 sm:text-xs">
                Kalpleri patlat!
              </p>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold tabular-nums text-rose-300 sm:text-3xl">
                    {popped.size}
                  </p>

                  <p className="text-[8px] uppercase tracking-widest text-rose-100/50">
                    Patlatılan
                  </p>
                </div>

                <p className="text-[10px] text-rose-100/40 tabular-nums sm:text-xs">
                  / {totalHearts}
                </p>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FİNAL: SADECE SAYAÇ */}
      <AnimatePresence>
        {finale && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.7,
              ease: 'easeOut',
            }}
          >
            <div className="text-center">
              <Countdown />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
