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
  size?: 'normal' | 'big'
}

let burstSeq = 0

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
          (Math.random() - 0.5) * 0.25

        const distance =
          burst.size === 'big'
            ? 45 + Math.random() * 115
            : 20 + Math.random() * 55

        const isHeart =
          burst.size === 'big' &&
          Math.random() < 0.22

        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          r:
            burst.size === 'big'
              ? 1.5 + Math.random() * 3.5
              : 1.2 + Math.random() * 1.8,
          scale:
            0.35 + Math.random() * 0.7,
          rotation: Math.random() * 360,
          isHeart,
          duration:
            0.7 + Math.random() * 0.65,
        }
      },
    )
  }, [burst])

  return (
    <g pointerEvents="none">
      {particles.map((p, i) => {
        if (p.isHeart) {
          return (
            <motion.g
              key={i}
              initial={{
                x: burst.x,
                y: burst.y,
                opacity: 1,
                scale: 0.2,
                rotate: p.rotation,
              }}
              animate={{
                x: burst.x + p.dx,
                y: burst.y + p.dy,
                opacity: 0,
                scale: p.scale,
                rotate: p.rotation + 180,
              }}
              transition={{
                duration: p.duration,
                ease: 'easeOut',
              }}
              onAnimationComplete={
                i === 0
                  ? () => onDone(burst.id)
                  : undefined
              }
            >
              <path
                d={HEART_PATH}
                fill={burst.color}
                stroke="#fff"
                strokeOpacity={0.25}
                strokeWidth={0.3}
              />
            </motion.g>
          )
        }

        return (
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
              scale: 0.4,
            }}
            animate={{
              opacity: 0,
              cx: burst.x + p.dx,
              cy: burst.y + p.dy,
              scale: 1,
            }}
            transition={{
              duration: p.duration,
              ease: 'easeOut',
            }}
            onAnimationComplete={
              i === 0
                ? () => onDone(burst.id)
                : undefined
            }
          />
        )
      })}
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
    size: 'normal' | 'big' = 'normal',
  ) => {
    const burst: Burst = {
      id: burstSeq++,
      x,
      y,
      color,
      count,
      size,
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

  useEffect(() => {
    if (!lightsOut) return

    const timer = setTimeout(() => {
      setHeartsActive(true)
    }, 350)

    return () => clearTimeout(timer)
  }, [lightsOut])

  useEffect(() => {
    if (!allPopped) return
    if (bigPhase !== 'hidden') return

    const timer = setTimeout(() => {
      setBigPhase('flying')
    }, 500)

    return () => clearTimeout(timer)
  }, [allPopped, bigPhase])

  const onBigHeartArrived = () => {
    setFlash(true)

    // ANA PEMBE PATLAMA
    spawnBurst(
      400,
      300,
      '#f43f5e',
      70,
      'big',
    )

    // YEŞİL IŞIK
    spawnBurst(
      400,
      300,
      '#34d399',
      45,
      'big',
    )

    // ALTIN PARILTILAR
    spawnBurst(
      400,
      300,
      '#fbbf24',
      35,
      'big',
    )

    // BEYAZ YILDIZLAR
    spawnBurst(
      400,
      300,
      '#ffffff',
      30,
      'big',
    )

    setTimeout(() => {
      setBigPhase('gone')
    }, 180)

    setTimeout(() => {
      setFlash(false)
    }, 650)

    // Patlamanın tamamen hissedilmesi için
    // sayaç biraz daha geç gelir.
    setTimeout(() => {
      setFinale(true)
    }, 1500)
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
      {/* ARKA PLAN */}
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

            {/* AĞAÇ DALLARI */}
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

            {/* TELEFON DOKUNMA ALANLARI */}
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

            {/* KÜÇÜK KALPLER */}
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

            {/* BÜYÜK FİNAL KALBİ */}
            <AnimatePresence>
              {bigPhase ===
                'flying' && (
                <motion.g
                  style={{
                    x: 400,
                  }}
                  initial={{
                    y: 650,
                    scale: 0.3,
                    opacity: 0,
                  }}
                  animate={{
                    y: 300,
                    scale: [
                      5.2,
                      6.2,
                      5.8,
                      6.5,
                    ],
                    opacity: [
                      0,
                      1,
                      1,
                      1,
                    ],
                  }}
                  exit={{
                    opacity: 0,
                    scale: 8,
                  }}
                  transition={{
                    duration: 1.15,
                    times: [
                      0,
                      0.45,
                      0.7,
                      1,
                    ],
                    ease: 'easeInOut',
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

                  {/* Kalbin iç parıltısı */}
                  <motion.path
                    d={HEART_PATH}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={0.7}
                    initial={{
                      opacity: 0.2,
                    }}
                    animate={{
                      opacity: [
                        0.2,
                        0.9,
                        0.3,
                        1,
                      ],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: 1,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.g>
              )}
            </AnimatePresence>

            {/* ŞAŞALI FİNAL PATLAMASI */}
            <AnimatePresence>
              {flash && (
                <>
                  {/* Beyaz flash */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="#ffffff"
                    initial={{
                      r: 0,
                      opacity: 0.95,
                    }}
                    animate={{
                      r: 300,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.65,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* Pembe shockwave */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#fb7185"
                    strokeWidth={4}
                    initial={{
                      r: 15,
                      opacity: 0.9,
                    }}
                    animate={{
                      r: 210,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* Yeşil shockwave */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={3}
                    initial={{
                      r: 20,
                      opacity: 0.8,
                    }}
                    animate={{
                      r: 270,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.1,
                      delay: 0.08,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* Altın shockwave */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    initial={{
                      r: 10,
                      opacity: 0.8,
                    }}
                    animate={{
                      r: 330,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.3,
                      delay: 0.12,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* Merkez ışık */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="#fff"
                    initial={{
                      r: 5,
                      opacity: 1,
                    }}
                    animate={{
                      r: 70,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.45,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />
                </>
              )}
            </AnimatePresence>

            {/* PARÇACIKLAR */}
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
