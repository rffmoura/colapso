import { motion, useAnimationControls } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { getDef } from '../engine/cards'
import { canAttack } from '../engine/game'
import type { Creature } from '../engine/types'
import {
  chooseInfluenceFace,
  choosePolarizeFace,
  clickCreature,
  refRegistry,
  useStore,
  validTargetKeys,
} from '../state/store'
import { CardView } from './CardView'
import { FloatFxList } from './FloatFxList'

export function BoardCreature({ c }: { c: Creature }) {
  const st = useStore()
  const key = `c-${c.uid}`

  const registerRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) refRegistry.set(key, el)
      else refRegistry.delete(key)
    },
    [key],
  )

  const validKeys = useMemo(() => validTargetKeys(st), [st.selection, st.game])
  const isValidTarget = validKeys.has(key)
  const isSelected = st.selection?.type === 'attacker' && st.selection.uid === c.uid
  const canBeAttacker =
    !st.busy &&
    st.phase === 'game' &&
    st.game.active === 'player' &&
    c.owner === 'player' &&
    st.selection === null &&
    canAttack(st.game, c)
  const exhausted = c.owner === st.game.active && c.attacksUsed > 0

  // investida de ataque
  const anim = st.attackAnim?.attacker === c.uid ? st.attackAnim : null

  // tremor ao sofrer dano
  const controls = useAnimationControls()
  const myDmg = st.fx.filter((f) => f.key === key && f.kind !== 'info')
  const lastDmgId = myDmg.length > 0 ? myDmg[myDmg.length - 1].id : 0
  const prevDmg = useRef(0)
  useEffect(() => {
    if (lastDmgId > prevDmg.current) {
      prevDmg.current = lastDmgId
      void controls.start({
        x: [0, -8, 7, -5, 3, 0],
        rotate: [0, -2, 2, -1, 0],
        transition: { duration: 0.42 },
      })
    }
  }, [lastDmgId, controls])

  const faceSelection =
    st.selection?.type === 'polarizeFace' || st.selection?.type === 'influenceFace' ? st.selection : null
  const showFaceChoice = faceSelection?.targetUid === c.uid
  const isInfluence = faceSelection?.type === 'influenceFace'
  const faces = showFaceChoice ? getDef(c.defId).faces! : null

  const isBlocking = st.blockPulse?.uids.includes(c.uid) ?? false

  const classes = [
    'creature',
    canBeAttacker ? 'selectable-attacker' : '',
    isSelected ? 'selected' : '',
    isValidTarget ? 'valid-target' : '',
    exhausted && !isSelected ? 'exhausted' : '',
    isBlocking ? 'barrier-deny' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      // entrada via CSS (.creature-enter); Motion cuida apenas da saída e da investida
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.35 } }}
      style={{ position: 'relative', zIndex: anim ? 9 : undefined }}
    >
      <motion.div
        className="creature-enter"
        animate={
          anim
            ? {
                x: [0, -anim.dx * 0.08, anim.dx * 0.82, 0],
                y: [0, -anim.dy * 0.08, anim.dy * 0.82, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={anim ? { duration: 0.64, times: [0, 0.28, 0.5, 1], ease: 'easeInOut' } : { duration: 0.15 }}
      >
        <motion.div animate={controls}>
          <div
            ref={registerRef}
            className={classes}
            role="button"
            aria-label={getDef(c.defId).name}
            aria-pressed={isSelected}
            tabIndex={c.owner === 'player' || isValidTarget ? 0 : -1}
            onClick={(e) => {
              e.stopPropagation()
              clickCreature(c.uid)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              e.stopPropagation()
              clickCreature(c.uid)
            }}
          >
            <CardView
              defId={c.defId}
              collapsed={c.collapsed}
              hp={c.collapsed !== null ? c.hp : undefined}
              size="board"
              tempKeywords={c.tempKeywords}
            />
            {c.entangledWith !== null && <span className="entangle-mark">∞</span>}
            {showFaceChoice && faces && (
              <div className={`face-choice${isInfluence ? ' influence-choice' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="face-choice-label">{isInfluence ? 'influenciar estado' : 'fixar estado'}</div>
                <button className="choice-0" onClick={() => (isInfluence ? chooseInfluenceFace(0) : choosePolarizeFace(0))}>
                  <span>A · {faces[0].label}</span>
                  {isInfluence && <small>75% desejado · 25% B</small>}
                </button>
                <button className="choice-1" onClick={() => (isInfluence ? chooseInfluenceFace(1) : choosePolarizeFace(1))}>
                  <span>B · {faces[1].label}</span>
                  {isInfluence && <small>75% desejado · 25% A</small>}
                </button>
              </div>
            )}
            <FloatFxList fxKey={key} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
