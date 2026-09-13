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
  size: 'small' | 'normal' | 'big'
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
          (Math.random() - 0.5) * 0.3

        const distance =
          burst.size === 'big'
            ? 50 + Math.random() * 145
            : burst.size === 'normal'
              ? 18 + Math.random() * 42
              : 12 + Math.random() * 24

        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          r:
            burst.size === 'big'
              ? 1.3 + Math.random() * 3.5
              : 1 + Math.random() * 2,
          duration:
            burst.size === 'big'
              ? 0.75 + Math.random() * 0.65
              : 0.5 + Math.random() * 0.3,
          rotation: Math.random() * 360,
        }
      },
    )
  }, [burst])

  return (
    <g pointerEvents="none">
      {particles.map((p, i) => (
        <motion.g
          key={i}
          initial={{
            x: burst.x,
            y: burst.y,
            opacity: 1,
            scale: 0.25,
            rotate: p.rotation,
          }}
          animate={{
            x: burst.x + p.dx,
            y: burst.y + p.dy,
            opacity: 0,
            scale:
              burst.size === 'big'
                ? 1
                : 0.8,
            rotate:
              p.rotation + 180,
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
          <circle
            cx={0}
            cy={0}
            r={p.r}
            fill={burst.color}
          />

          {burst.size === 'big' &&
            i % 7 === 0 && (
              <path
                d={HEART_PATH}
                transform="scale(0.45)"
                fill={burst.color}
                opacity={0.9}
              />
            )}
        </motion.g>
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
    <g pointerEvents="none">
      {/* Yumuşak ışık halesi */}
      {lightable && lit && (
        <motion.line
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke="#fbbf24"
          strokeWidth={seg.width + 5}
          strokeLinecap="round"
          opacity={0.22}
          filter="url(#softGlow)"
          animate={{
            opacity: [
              0.12,
              0.3,
              0.12,
            ],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

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
        filter={
          lightable && lit
            ? 'url(#lightGlow)'
            : undefined
        }
        initial={{
          pathLength: 0,
          opacity: 0,
        }}
        animate={
          lightable && lit
            ? {
                pathLength: 1,
                opacity: [
                  0.78,
                  1,
                  0.78,
                ],
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
        touchAction: 'none',
        filter: 'url(#heartGlow)',
      }}
      initial={{
        scale: 0,
        opacity: 0,
      }}
      animate={{
        scale: [
          heart.size * 0.92,
          heart.size * 1.04,
          heart.size * 0.92,
        ],
        opacity: 1,
      }}
      whileTap={{
        scale: heart.size * 0.55,
      }}
      transition={{
        delay: heart.delay,
        scale: {
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        opacity: {
          duration: 0.3,
        },
        type: 'spring',
        stiffness: 220,
        damping: 12,
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()

        if (
          typeof navigator !==
            'undefined' &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(12)
        }

        onPop(heart)
      }}
    >
      {/* Kalbin yumuşak ışığı */}
      <path
        d={HEART_PATH}
        fill={heart.color}
        opacity={0.28}
        transform="scale(1.45)"
      />

      <path
        d={HEART_PATH}
        fill={heart.color}
        stroke="#ecfdf5"
        strokeOpacity={0.28}
        strokeWidth={0.45}
      />

      {/* Kalp üzerindeki küçük parlaklık */}
      <path
        d={HEART_PATH}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.32}
        strokeWidth={0.35}
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
    size: Burst['size'] = 'normal',
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
      10,
      'small',
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
      '#34d399',
      12,
      'normal',
    )

    spawnBurst(
      heart.x,
      heart.y,
      heart.color,
      5,
      'small',
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
    if (
      typeof navigator !==
        'undefined' &&
      'vibrate' in navigator
    ) {
      navigator.vibrate([
        25,
        30,
        45,
      ])
    }

    setFlash(true)

    // Büyük yeşil patlama
    spawnBurst(
      400,
      300,
      '#10b981',
      90,
      'big',
    )

    spawnBurst(
      400,
      300,
      '#34d399',
      70,
      'big',
    )

    spawnBurst(
      400,
      300,
      '#86efac',
      55,
      'big',
    )

    spawnBurst(
      400,
      300,
      '#d9f99d',
      35,
      'big',
    )

    setTimeout(() => {
      setBigPhase('gone')
    }, 180)

    setTimeout(() => {
      setFlash(false)
    }, 900)

    // Patlama sakinleştikten sonra sayaç.
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

      {/* AĞAÇ */}
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

              <filter
                id="lightGlow"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur
                  stdDeviation="3.5"
                  result="blur"
                />

                <feMerge>
                  <feMergeNode
                    in="blur"
                  />
                  <feMergeNode
                    in="SourceGraphic"
                  />
                </feMerge>
              </filter>

              <filter
                id="softGlow"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur
                  stdDeviation="6"
                />
              </filter>

              <filter
                id="heartGlow"
                x="-120%"
                y="-120%"
                width="340%"
                height="340%"
              >
                <feGaussianBlur
                  stdDeviation="2.8"
                  result="blur"
                />

                <feMerge>
                  <feMergeNode
                    in="blur"
                  />
                  <feMergeNode
                    in="SourceGraphic"
                  />
                </feMerge>
              </filter>
            </defs>

            <ellipse
              cx={400}
              cy={565}
              rx={210}
              ry={24}
              fill="url(#ground)"
              pointerEvents="none"
            />

            {/* DALLAR */}
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

            {/* DOKUNMA ALANLARI */}
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
                    scale: 0.25,
                    opacity: 0,
                  }}
                  animate={{
                    y: 300,
                    scale: [
                      4.5,
                      5.8,
                      5.35,
                      6,
                      5.7,
                    ],
                    opacity: [
                      0,
                      1,
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
                    duration: 1.25,
                    times: [
                      0,
                      0.42,
                      0.62,
                      0.82,
                      1,
                    ],
                    ease: 'easeInOut',
                  }}
                  onAnimationComplete={
                    onBigHeartArrived
                  }
                >
                  {/* Büyük kalbin aura'sı */}
                  <motion.path
                    d={HEART_PATH}
                    fill="#10b981"
                    opacity={0.22}
                    transform="scale(1.55)"
                    filter="url(#heartGlow)"
                    animate={{
                      opacity: [
                        0.12,
                        0.32,
                        0.18,
                        0.4,
                      ],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: 1,
                      ease: 'easeInOut',
                    }}
                  />

                  <path
                    d={HEART_PATH}
                    fill="#10b981"
                    stroke="#a7f3d0"
                    strokeWidth={0.65}
                  />

                  <motion.path
                    d={HEART_PATH}
                    fill="none"
                    stroke="#ecfdf5"
                    strokeWidth={0.75}
                    initial={{
                      opacity: 0.15,
                    }}
                    animate={{
                      opacity: [
                        0.15,
                        0.95,
                        0.35,
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

            {/* FİNAL PATLAMA */}
            <AnimatePresence>
              {flash && (
                <>
                  {/* Merkezi flaş */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="#ecfdf5"
                    initial={{
                      r: 0,
                      opacity: 1,
                    }}
                    animate={{
                      r: 90,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.42,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* 1. enerji halkası */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={7}
                    initial={{
                      r: 10,
                      opacity: 1,
                    }}
                    animate={{
                      r: 190,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.7,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* 2. enerji halkası */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={5}
                    initial={{
                      r: 15,
                      opacity: 0.9,
                    }}
                    animate={{
                      r: 280,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.95,
                      delay: 0.08,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* 3. enerji halkası */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth={3}
                    initial={{
                      r: 20,
                      opacity: 0.85,
                    }}
                    animate={{
                      r: 350,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.2,
                      delay: 0.14,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  {/* Arka plan yeşil ışık */}
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="#10b981"
                    initial={{
                      r: 0,
                      opacity: 0.18,
                    }}
                    animate={{
                      r: 420,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.1,
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
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_2px] shadow-rose-400/50 sm:h-2 sm:w-2" />

                <p className="text-[9px] font-medium uppercase tracking-widest text-rose-100/70 sm:text-xs">
                  Kalp Avı
                </p>
              </div>

              <p className="mb-2 text-[10px] text-rose-100/50 sm:mb-3 sm:text-xs">
                Kalpleri patlat!
              </p>

              <div className="flex items-end justify-between">
                <div>
                  <motion.p
                    key={popped.size}
                    initial={{
                      scale: 1.25,
                      color: '#a7f3d0',
                    }}
                    animate={{
                      scale: 1,
                      color: '#fda4af',
                    }}
                    className="text-xl font-bold tabular-nums sm:text-3xl"
                  >
                    {popped.size}
                  </motion.p>

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
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-rose-300 shadow-[0_0_8px_rgba(52,211,153,0.55)]"
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

      {/* FİNAL — SADECE MEVCUT SAYAÇ */}
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
