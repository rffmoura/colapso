import { motion } from 'motion/react'
import { startGame, toggleManual } from '../state/store'
import { CharacterArt } from './characters'

const CAST = ['gato', 'colapsador', 'sentinela', 'ondapiloto', 'eletron', 'singularidade']

export function TitleScreen() {
  return (
    <div className="title-screen">
      <motion.div
        className="title-kicker"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        instituto meia-vida · divisão de observação · turno da noite
      </motion.div>

      <motion.h1
        className="title-logo"
        initial={{ opacity: 0, y: 26, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        COLA<span className="half-a">P</span><span className="half-b">S</span>O
      </motion.h1>

      <motion.p
        className="title-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.6 }}
      >
        Um duelo de fichas onde nada está decidido até alguém olhar.
      </motion.p>

      <motion.p
        className="title-lore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        O Instituto estuda o que o universo faz quando ninguém está olhando. Toda noite, um Observador
        humano e o Autômato da casa disputam a custódia dos sujeitos do arquivo — criaturas que são
        duas coisas ao mesmo tempo até serem observadas. Você é o Observador desta noite.
        Observar é interferir; interferir é vencer.
      </motion.p>

      <motion.div
        className="title-cast"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {CAST.map((id) => (
          <div key={id} className="cast-slot">
            <CharacterArt defId={id} />
          </div>
        ))}
      </motion.div>

      <motion.div
        className="title-actions"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <button className="btn-stamp" onClick={startGame}>
          Assumir o plantão
        </button>
        <button className="btn-paper" onClick={toggleManual}>
          Manual do Observador
        </button>
      </motion.div>
    </div>
  )
}
