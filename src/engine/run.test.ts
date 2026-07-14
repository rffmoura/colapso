import { describe, expect, it } from 'vitest'
import {
  acceptInitialSecret,
  acceptRewardSecret,
  buildMatchSetup,
  createRun,
  equipForNextDuel,
  prepareReward,
} from './run'

describe('Plantão contínuo', () => {
  it('oferece três contramedidas únicas e nunca repete uma adquirida', () => {
    let run = createRun(() => 0)
    expect(new Set(run.offeredSecrets).size).toBe(3)
    run = acceptInitialSecret(run, run.offeredSecrets[0])

    for (let victory = 0; victory < 3; victory++) {
      run = prepareReward(run, () => 0)
      expect(run.offeredSecrets).toHaveLength(3)
      expect(run.offeredSecrets.every((id) => !run.arsenal.includes(id))).toBe(true)
      run = acceptRewardSecret(run, run.offeredSecrets[0])
      expect(new Set(run.directives).size).toBe(victory + 1)
      run = equipForNextDuel(run, run.arsenal.at(-1)!)
    }

    expect(run.stage).toBe(3)
    expect(run.arsenal).toHaveLength(4)
    expect(run.directives).toHaveLength(3)
  })

  it('cria o chefe com duas contramedidas distintas e reinicia sem progresso', () => {
    let run = createRun(() => 0)
    run = acceptInitialSecret(run, run.offeredSecrets[0])
    for (let victory = 0; victory < 3; victory++) {
      run = prepareReward(run, () => 0)
      run = acceptRewardSecret(run, run.offeredSecrets[0])
      run = equipForNextDuel(run, run.arsenal[0])
    }
    const match = buildMatchSetup(run, () => 0)
    expect(match.boss).toBe(true)
    expect(match.duel).toBe(4)
    expect(new Set(match.aiSecrets).size).toBe(2)

    const reset = createRun(() => 0)
    expect(reset.stage).toBe(0)
    expect(reset.arsenal).toEqual([])
    expect(reset.directives).toEqual([])
  })
})
