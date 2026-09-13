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
  kind?: 'dot' | 'heart'
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
          (Math.random() - 0.5) * 0.34

        const distance =
          burst.size === 'big'
            ? 55 + Math.random() * 155
            : burst.size === 'normal'
              ? 18 + Math.random() * 48
              : 12 + Math.random() * 26

        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          r:
            burst.size === 'big'
              ? 1.2 + Math.random() * 3.6
              : burst.size === 'normal'
                ? 1 + Math.random() * 2.1
                : 0.8 + Math.random() * 1.5,
          duration:
            burst.size === 'big'
              ? 0.8 + Math.random() * 0.7
              : 0.5 + Math.random() * 0.35,
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
            scale: 0.2,
            rotate: p.rotation,
          }}
          animate={{
            x: burst.x + p.dx,
            y: burst.y + p.dy,
            opacity: 0,
            scale:
              burst.size === 'big'
                ? 1
                : 0.75,
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
          {burst.kind === 'heart' ? (
            <path
              d={HEART_PATH}
              transform="scale(0.42)"
              fill={burst.color}
              opacity={0.95}
            />
          ) : (
            <circle
              cx={0}
              cy={0}
              r={p.r}
              fill={burst.color}
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
      {lightable && lit && (
        <>
          <motion.line
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="#fbbf24"
            strokeWidth={seg.width + 8}
            strokeLinecap="round"
            opacity={0.16}
            filter="url(#softGlow)"
            animate={{
              opacity: [
                0.1,
                0.26,
                0.1,
              ],
            }}
            transition={{
              duration: 1.9,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.line
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="#fde68a"
            strokeWidth={seg.width + 2}
            strokeLinecap="round"
            opacity={0.2}
            filter="url(#lightGlow)"
          />
        </>
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
                  duration: 0.42,
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
                  duration: 0.42,
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
          heart.size * 1.06,
          heart.size * 0.92,
        ],
        opacity: 1,
      }}
      whileTap={{
        scale: heart.size * 0.5,
      }}
      transition={{
        delay: heart.delay,
        scale: {
          duration: 2.1,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        opacity: {
          duration: 0.3,
        },
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()

        if (
          typeof navigator !== 'undefined' &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(12)
        }

        onPop(heart)
      }}
    >
      <path
        d={HEART_PATH}
        fill={heart.color}
        opacity={0.24}
        transform="scale(1.55)"
      />

      <path
        d={HEART_PATH}
        fill={heart.color}
        stroke="#ecfdf5"
        strokeOpacity={0.34}
        strokeWidth={0.45}
      />

      <path
        d={HEART_PATH}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.38}
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
    kind: Burst['kind'] = 'dot',
  ) => {
    const burst: Burst = {
      id: burstSeq++,
      x,
      y,
      color,
      count,
      size,
      kind,
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
      12,
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
      '#10b981',
      15,
      'normal',
    )

    spawnBurst(
      heart.x,
      heart.y,
      '#86efac',
      6,
      'small',
      'dot',
    )

    spawnBurst(
      heart.x,
      heart.y,
      heart.color,
      3,
      'small',
      'heart',
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
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      navigator.vibrate([
        25,
        25,
        45,
        20,
        70,
      ])
    }

    setFlash(true)

    // Çok katmanlı yeşil final patlaması.
    spawnBurst(
      400,
      300,
      '#10b981',
      105,
      'big',
    )

    spawnBurst(
      400,
      300,
      '#34d399',
      80,
      'big',
    )

    spawnBurst(
      400,
      300,
      '#86efac',
      60,
      'big',
    )

    spawnBurst(
      400,
      300,
      '#d9f99d',
      35,
      'big',
    )

    // Patlamanın içinden küçük kalpler.
    spawnBurst(
      400,
      300,
      '#6ee7b7',
      12,
      'big',
      'heart',
    )

    setTimeout(() => {
      setBigPhase('gone')
    }, 190)

    setTimeout(() => {
      setFlash(false)
    }, 1150)

    // Mevcut sayaç/kilit ekranına geçiş.
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 76%, rgba(16,185,129,0.18), transparent 70%)',
        }}
      />

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
                  stopColor="rgba(16,185,129,0.4)"
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
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
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
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
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

            {segments.map((segment) => (
              <Branch
                key={segment.id}
                seg={segment}
                lit={
                  isLightable(segment.depth) &&
                  !extinguished.has(segment.id)
                }
              />
            ))}

            <g style={{ touchAction: 'none' }}>
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
              {bigPhase === 'flying' && (
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
                      4.4,
                      5.4,
                      5.05,
                      5.8,
                      5.45,
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
                    scale: 8.5,
                  }}
                  transition={{
                    duration: 1.3,
                    times: [
                      0,
                      0.4,
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
                  {/* Gölge yok — sadece ışık halesi */}
                  <motion.path
                    d={HEART_PATH}
                    fill="#10b981"
                    opacity={0.2}
                    transform="scale(1.55)"
                    filter="url(#heartGlow)"
                    animate={{
                      opacity: [
                        0.1,
                        0.3,
                        0.16,
                        0.42,
                      ],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: 1,
                      ease: 'easeInOut',
                    }}
                  />

                  <motion.path
                    d={HEART_PATH}
                    fill="#10b981"
                    stroke="#a7f3d0"
                    strokeWidth={0.65}
                    animate={{
                      fill: [
                        '#10b981',
                        '#34d399',
                        '#10b981',
                      ],
                    }}
                    transition={{
                      duration: 0.75,
                      repeat: 1,
                      ease: 'easeInOut',
                    }}
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
                        1,
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
                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="#ecfdf5"
                    initial={{
                      r: 0,
                      opacity: 1,
                    }}
                    animate={{
                      r: 105,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.38,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={9}
                    initial={{
                      r: 8,
                      opacity: 1,
                    }}
                    animate={{
                      r: 190,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.68,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth={6}
                    initial={{
                      r: 15,
                      opacity: 0.95,
                    }}
                    animate={{
                      r: 290,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.9,
                      delay: 0.06,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="none"
                    stroke="#86efac"
                    strokeWidth={3.5}
                    initial={{
                      r: 20,
                      opacity: 0.9,
                    }}
                    animate={{
                      r: 365,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.15,
                      delay: 0.12,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />

                  <motion.circle
                    cx={400}
                    cy={300}
                    fill="#10b981"
                    initial={{
                      r: 0,
                      opacity: 0.2,
                    }}
                    animate={{
                      r: 430,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.05,
                      ease: 'easeOut',
                    }}
                    pointerEvents="none"
                  />
                </>
              )}
            </AnimatePresence>

            {bursts.map((burst) => (
              <BurstGroup
                key={burst.id}
                burst={burst}
                onDone={removeBurst}
              />
            ))}
          </motion.svg>
        )}
      </AnimatePresence>

      {/* ÜST YAZI */}
      <AnimatePresence>
        {!lightsOut && !finale && (
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
            <div className="rounded-xl border border-emerald-400/20 bg-black/45 p-2.5 backdrop-blur-md sm:rounded-2xl sm:p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px] shadow-emerald-400/50 sm:h-2 sm:w-2" />

                <p className="text-[9px] font-medium uppercase tracking-widest text-emerald-100/70 sm:text-xs">
                  Kalp Avı
                </p>
              </div>

              <p className="mb-2 text-[10px] text-emerald-100/50 sm:mb-3 sm:text-xs">
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
                      color: '#6ee7b7',
                    }}
                    className="text-xl font-bold tabular-nums sm:text-3xl"
                  >
                    {popped.size}
                  </motion.p>

                  <p className="text-[8px] uppercase tracking-widest text-emerald-100/50">
                    Patlatılan
                  </p>
                </div>

                <p className="text-[10px] text-emerald-100/40 tabular-nums sm:text-xs">
                  / {totalHearts}
                </p>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-300 to-lime-200 shadow-[0_0_9px_rgba(52,211,153,0.65)]"
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

      {/* FİNAL — MEVCUT COUNTDOWN */}
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
