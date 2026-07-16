import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sampleRate = 22050
const destination = resolve('apps/native/assets/audio')
mkdirSync(destination, { recursive: true })

let noiseState = 1953
function random() {
  noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0
  return noiseState / 4294967296
}

function oscillator(type, phase) {
  if (type === 'square') return Math.sin(phase) >= 0 ? 1 : -1
  if (type === 'saw') return 2 * ((phase / (Math.PI * 2)) % 1) - 1
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase))
  return Math.sin(phase)
}

function render(duration, layers) {
  const length = Math.ceil(duration * sampleRate)
  const data = new Float32Array(length)
  for (const layer of layers) {
    const start = Math.floor((layer.at ?? 0) * sampleRate)
    const layerLength = Math.max(1, Math.floor(layer.duration * sampleRate))
    let phase = 0
    for (let i = 0; i < layerLength && start + i < length; i++) {
      const progress = i / layerLength
      const attack = Math.min(1, progress / 0.06)
      const envelope = attack * Math.pow(1 - progress, layer.decay ?? 1.7)
      let sample
      if (layer.type === 'noise') {
        sample = random() * 2 - 1
      } else {
        const frequency = layer.from * Math.pow((layer.to ?? layer.from) / layer.from, progress)
        phase += (Math.PI * 2 * frequency) / sampleRate
        sample = oscillator(layer.type, phase)
      }
      data[start + i] += sample * layer.volume * envelope
    }
  }
  return data
}

function writeWav(name, data) {
  const buffer = Buffer.alloc(44 + data.length * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + data.length * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(data.length * 2, 40)
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]))
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2)
  }
  writeFileSync(resolve(destination, `${name}.wav`), buffer)
}

const sounds = {
  select: [0.1, [{ type: 'triangle', from: 520, duration: 0.09, volume: 0.32 }]],
  deny: [0.24, [
    { type: 'square', from: 180, duration: 0.1, volume: 0.24 },
    { type: 'square', from: 140, at: 0.1, duration: 0.14, volume: 0.24 },
  ]],
  draw: [0.2, [
    { type: 'triangle', from: 340, duration: 0.12, volume: 0.3 },
    { type: 'triangle', from: 510, at: 0.06, duration: 0.12, volume: 0.25 },
  ]],
  play: [0.24, [
    { type: 'noise', duration: 0.13, volume: 0.2 },
    { type: 'triangle', from: 220, to: 330, duration: 0.2, volume: 0.38 },
  ]],
  spell: [0.32, [
    { type: 'sine', from: 620, to: 940, duration: 0.28, volume: 0.3 },
    { type: 'sine', from: 310, to: 470, at: 0.03, duration: 0.27, volume: 0.22 },
  ]],
  collapse: [0.48, [
    { type: 'saw', from: 1400, to: 180, duration: 0.42, volume: 0.16 },
    { type: 'sine', from: 880, at: 0.02, duration: 0.16, volume: 0.36 },
    { type: 'noise', at: 0.05, duration: 0.27, volume: 0.28 },
  ]],
  oscillate: [0.34, [
    { type: 'triangle', from: 360, to: 680, duration: 0.25, volume: 0.28 },
    { type: 'triangle', from: 680, to: 360, at: 0.04, duration: 0.25, volume: 0.22 },
  ]],
  hit: [0.2, [
    { type: 'noise', duration: 0.18, volume: 0.58 },
    { type: 'square', from: 120, to: 60, duration: 0.18, volume: 0.28 },
  ]],
  death: [0.55, [
    { type: 'saw', from: 300, to: 60, duration: 0.52, volume: 0.25 },
    { type: 'noise', duration: 0.42, volume: 0.3 },
  ]],
  entangle: [0.48, [
    { type: 'sine', from: 440, to: 660, duration: 0.34, volume: 0.28 },
    { type: 'sine', from: 554, to: 831, at: 0.08, duration: 0.34, volume: 0.26 },
  ]],
  turn: [0.38, [
    { type: 'triangle', from: 392, duration: 0.16, volume: 0.3 },
    { type: 'triangle', from: 587, at: 0.11, duration: 0.22, volume: 0.3 },
  ]],
  secret: [0.5, [
    { type: 'noise', duration: 0.2, volume: 0.25 },
    { type: 'square', from: 190, to: 420, duration: 0.24, volume: 0.2 },
    { type: 'triangle', from: 740, at: 0.18, duration: 0.25, volume: 0.32 },
  ]],
  win: [0.72, [523, 659, 784, 1047].map((from, index) => ({
    type: 'triangle', from, at: index * 0.12, duration: 0.34, volume: 0.3,
  }))],
  lose: [0.86, [[392, 0], [330, 0.15], [262, 0.3], [196, 0.45]].map(([from, at]) => ({
    type: 'saw', from, at, duration: 0.4, volume: 0.21,
  }))],
}

for (const [name, [duration, layers]] of Object.entries(sounds)) {
  writeWav(name, render(duration, layers))
}
