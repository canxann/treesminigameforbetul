export type Segment = {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
  depth: number
  width: number
  delay: number
}

export type HeartData = {
  id: number
  x: number
  y: number
  color: string
  size: number
  delay: number
}

// Küçük, hızlı ve deterministik PRNG.
// Ağaç her render'da aynı şekilde oluşur.
function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0

    let t = Math.imul(
      a ^ (a >>> 15),
      1 | a,
    )

    t =
      (t +
        Math.imul(
          t ^ (t >>> 7),
          61 | t,
        )) ^
      t

    return (
      ((t ^ (t >>> 14)) >>> 0) /
      4294967296
    )
  }
}

const GREENS = [
  '#22c55e',
  '#16a34a',
  '#4ade80',
  '#15803d',
  '#34d399',
  '#10b981',
]

const ACCENTS = [
  '#f43f5e',
  '#fb7185',
  '#ec4899',
  '#e11d48',
]

const MAX_DEPTH = 5

const toRad = (d: number) =>
  (d * Math.PI) / 180

export function generateTree(seed = 7) {
  const rng = mulberry32(seed)

  const segments: Segment[] = []
  const hearts: HeartData[] = []

  let sid = 0
  let hid = 0

  const pickColor = () =>
    rng() < 0.8
      ? GREENS[
          Math.floor(
            rng() * GREENS.length,
          )
        ]
      : ACCENTS[
          Math.floor(
            rng() * ACCENTS.length,
          )
        ]

  function branch(
    x: number,
    y: number,
    angle: number,
    len: number,
    depth: number,
  ) {
    const x2 =
      x +
      Math.cos(toRad(angle)) * len

    const y2 =
      y +
      Math.sin(toRad(angle)) * len

    segments.push({
      id: sid++,
      x1: x,
      y1: y,
      x2,
      y2,
      depth,
      width:
        (MAX_DEPTH - depth) * 1.7 + 2,
      delay: depth * 0.16,
    })

    if (depth >= MAX_DEPTH) {
      hearts.push({
        id: hid++,
        x: x2,
        y: y2,
        color: pickColor(),
        size: 1 + rng() * 0.7,
        delay: 0,
      })

      return
    }

    const spread =
      20 + rng() * 14

    const lf =
      0.72 + rng() * 0.1

    branch(
      x2,
      y2,
      angle -
        spread +
        (rng() * 8 - 4),
      len * lf,
      depth + 1,
    )

    branch(
      x2,
      y2,
      angle +
        spread +
        (rng() * 8 - 4),
      len * lf,
      depth + 1,
    )

    // İç dallarda ekstra kalpler.
    if (
      depth >= 2 &&
      rng() < 0.4
    ) {
      hearts.push({
        id: hid++,
        x: x2,
        y: y2,
        color: pickColor(),
        size:
          0.8 + rng() * 0.5,
        delay: 0,
      })
    }
  }

  // Ağacın gövdesi biraz daha yukarıdan başlıyor.
  // Böylece telefon ekranında alt tarafa yapışmıyor.
  branch(
    400,
    525,
    -90,
    118,
    0,
  )

  // Kalpler sırayla ortaya çıksın.
  hearts.forEach((heart, i) => {
    heart.delay = i * 0.028
  })

  return {
    segments,
    hearts,
    maxDepth: MAX_DEPTH,
  }
}

// Kalp path'i merkeze göre çizilir.
export const HEART_PATH =
  'M0 3 C 0 -1 -5 -4 -8 -1 C -11 2 -9 7 0 12 C 9 7 11 2 8 -1 C 5 -4 0 -1 0 3 Z'
