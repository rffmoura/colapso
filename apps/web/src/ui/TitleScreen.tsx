import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { getDef } from '@colapso/game-core'
import { startGame, toggleManual } from '../state/store'
import { CharacterArt } from './characters'

const CAST = ['gato', 'colapsador', 'sentinela', 'ondapiloto', 'eletron', 'singularidade']

export function TitleScreen() {
  return (
    <div className="title-screen">
      <motion.div
        className="title-copy"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="title-kicker">instituto meia-vida · divisão de observação · turno da noite</div>

        <h1 className="title-logo" aria-label="COLAPSO">
          <span className="title-wordmark" aria-hidden="true">
            COLA<span className="half-a">P</span><span className="half-b">S</span>
            <img className="title-logo-mark" src="/colapso-mark.svg" alt="" />
          </span>
        </h1>

        <p className="title-sub">Um duelo de fichas onde nada está decidido até alguém olhar.</p>

        <p className="title-lore">
          O Instituto estuda o que o universo faz quando ninguém está olhando. Toda noite, um Observador
          humano e o Autômato disputam a custódia de sujeitos que existem em dois estados ao mesmo tempo.
          Você é o Observador desta noite. Observar é interferir; interferir é vencer.
        </p>

        <div className="title-actions">
          <button className="btn-stamp" onClick={startGame}>
            Assumir o plantão
          </button>
          <button className="btn-paper" onClick={toggleManual}>
            Manual do Observador
          </button>
        </div>
      </motion.div>

      <motion.div
        className="title-dossier"
        initial={{ opacity: 0, y: 26, rotate: 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0.4 }}
        transition={{ delay: 0.16, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Sujeitos em custódia do Instituto"
      >
        <div className="dossier-tab">arquivo de sujeitos · acesso restrito</div>
        <div className="title-cast">
          {CAST.map((id, index) => (
            <div key={id} className="cast-slot" style={{ '--cast-index': index } as CSSProperties}>
              <CharacterArt defId={id} />
              <span>{getDef(id).name}</span>
            </div>
          ))}
        </div>
        <div className="dossier-note">não observe sem autorização</div>
        <div className="dossier-stamp" aria-hidden="true">
          confidencial
        </div>
      </motion.div>
    </div>
  )
}
