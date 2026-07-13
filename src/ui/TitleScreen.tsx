import { motion } from 'motion/react'
import { startGame } from '../state/store'

export function TitleScreen() {
  const letters = 'COLAPSO'.split('')
  return (
    <div className="title-screen">
      <motion.div
        className="title-logo"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {letters.map((l, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.22}s` }}>
            {l}
          </span>
        ))}
      </motion.div>

      <motion.p
        className="title-tag"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Um duelo de cartas onde nada está decidido até alguém olhar.
        <br />
        <strong>Observar é interferir.</strong>
      </motion.p>

      <motion.div
        className="title-rules"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
      >
        <div className="title-rule r-particle">
          <b>Superposição</b>
          Cada criatura carrega dois estados possíveis, com forças e habilidades diferentes.
        </div>
        <div className="title-rule r-wave">
          <b>Colapso</b>
          Ao atacar, ser atacada ou medida, a criatura colapsa num único estado. Para sempre.
        </div>
        <div className="title-rule r-entangle">
          <b>Emaranhamento</b>
          Cartas vinculadas colapsam juntas e compartilham a dor da decoerência.
        </div>
      </motion.div>

      <motion.button
        className="btn-start"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        onClick={startGame}
      >
        Iniciar duelo
      </motion.button>
    </div>
  )
}
