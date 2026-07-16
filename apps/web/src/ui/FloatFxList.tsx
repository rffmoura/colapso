import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../state/store'

/** Números de dano e avisos flutuantes ancorados a um alvo (carta ou herói). */
export function FloatFxList({ fxKey }: { fxKey: string }) {
  const st = useStore()
  const mine = st.fx.filter((f) => f.key === fxKey)
  return (
    <AnimatePresence>
      {mine.map((f) => (
        <motion.div
          key={f.id}
          className={`float-fx ${f.kind}`}
          initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.7 }}
          animate={{ opacity: 1, y: -44, x: '-50%', scale: 1.15 }}
          exit={{ opacity: 0, y: -62, x: '-50%' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {f.text}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
