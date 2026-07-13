import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  speed: number
  color: string
  phase: number
}

const STAR_COLORS = [
  'oklch(0.9 0.02 300)',
  'oklch(0.9 0.02 300)',
  'oklch(0.9 0.02 300)',
  'oklch(0.78 0.16 70)',
  'oklch(0.8 0.13 220)',
]

export function Background() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let stars: Star[] = []
    let raf = 0

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.floor((w * h) / 9000)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.4,
        speed: 0.02 + Math.random() * 0.12,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        phase: Math.random() * Math.PI * 2,
      }))
    }

    let t = 0
    function frame() {
      t += 1 / 60
      ctx!.clearRect(0, 0, w, h)
      for (const s of stars) {
        s.y -= s.speed
        if (s.y < -2) {
          s.y = h + 2
          s.x = Math.random() * w
        }
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.phase))
        ctx!.globalAlpha = tw
        ctx!.fillStyle = s.color
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }

    resize()
    frame()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="bg-canvas" />
}
