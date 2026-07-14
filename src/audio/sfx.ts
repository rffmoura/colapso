/** Efeitos sonoros sintetizados via WebAudio — zero assets externos. */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

function ensure(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.35
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(m: boolean) {
  muted = m
}

export function isMuted() {
  return muted
}

function tone(
  freq: number,
  dur: number,
  opts: { type?: OscillatorType; vol?: number; slideTo?: number; delay?: number } = {},
) {
  const ac = ensure()
  if (!ac || !master || muted) return
  const t0 = ac.currentTime + (opts.delay ?? 0)
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(opts.vol ?? 0.5, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(gain)
  gain.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

function noise(dur: number, opts: { vol?: number; freq?: number; delay?: number } = {}) {
  const ac = ensure()
  if (!ac || !master || muted) return
  const t0 = ac.currentTime + (opts.delay ?? 0)
  const len = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ac.createBufferSource()
  src.buffer = buf
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = opts.freq ?? 800
  const gain = ac.createGain()
  gain.gain.setValueAtTime(opts.vol ?? 0.4, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  src.start(t0)
}

export const sfx = {
  select: () => tone(520, 0.08, { type: 'triangle', vol: 0.18 }),
  deny: () => {
    tone(180, 0.09, { type: 'square', vol: 0.2 })
    tone(140, 0.14, { type: 'square', vol: 0.2, delay: 0.09 })
  },
  draw: () => {
    tone(340, 0.09, { type: 'triangle', vol: 0.2 })
    tone(510, 0.09, { type: 'triangle', vol: 0.16, delay: 0.05 })
  },
  play: () => {
    noise(0.12, { vol: 0.18, freq: 1400 })
    tone(220, 0.18, { type: 'triangle', vol: 0.3, slideTo: 320 })
  },
  spell: () => {
    tone(620, 0.25, { type: 'sine', vol: 0.25, slideTo: 940 })
    tone(310, 0.25, { type: 'sine', vol: 0.15, slideTo: 470, delay: 0.03 })
  },
  collapse: () => {
    tone(1400, 0.4, { type: 'sawtooth', vol: 0.1, slideTo: 180 })
    tone(880, 0.14, { type: 'sine', vol: 0.3, delay: 0.02 })
    noise(0.25, { vol: 0.25, freq: 2400, delay: 0.05 })
  },
  hit: () => {
    noise(0.16, { vol: 0.5, freq: 500 })
    tone(120, 0.16, { type: 'square', vol: 0.25, slideTo: 60 })
  },
  death: () => {
    tone(300, 0.5, { type: 'sawtooth', vol: 0.2, slideTo: 60 })
    noise(0.4, { vol: 0.3, freq: 900 })
  },
  entangle: () => {
    tone(440, 0.3, { type: 'sine', vol: 0.22, slideTo: 660 })
    tone(554, 0.3, { type: 'sine', vol: 0.22, slideTo: 831, delay: 0.08 })
  },
  turn: () => {
    tone(392, 0.14, { type: 'triangle', vol: 0.25 })
    tone(587, 0.2, { type: 'triangle', vol: 0.25, delay: 0.1 })
  },
  win: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.3, delay: i * 0.12 }))
  },
  lose: () => {
    ;[392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, { type: 'sawtooth', vol: 0.18, delay: i * 0.15 }))
  },
}
