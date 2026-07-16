import { DIRECTIVE_IDS, SECRET_IDS } from './secrets'
import type { DirectiveId, MatchSetup, RunState, SecretId } from './types'

function sampleWithoutReplacement<T>(source: readonly T[], count: number, random: () => number): T[] {
  const pool = [...source]
  const result: T[] = []
  while (pool.length > 0 && result.length < count) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

export function createRun(random: () => number = Math.random): RunState {
  return {
    stage: 0,
    arsenal: [],
    directives: [],
    equippedSecret: null,
    offeredSecrets: sampleWithoutReplacement(SECRET_IDS, 3, random),
    pendingDirective: null,
    rewardStep: 'draft',
  }
}

export function acceptInitialSecret(run: RunState, secret: SecretId): RunState {
  if (!run.offeredSecrets.includes(secret)) return run
  return {
    ...run,
    arsenal: [secret],
    equippedSecret: secret,
    offeredSecrets: [],
  }
}

export function prepareReward(run: RunState, random: () => number = Math.random): RunState {
  const directivePool = DIRECTIVE_IDS.filter((id) => !run.directives.includes(id))
  const [pendingDirective] = sampleWithoutReplacement(directivePool, 1, random)
  const secretPool = SECRET_IDS.filter((id) => !run.arsenal.includes(id))
  return {
    ...run,
    pendingDirective,
    offeredSecrets: sampleWithoutReplacement(secretPool, 3, random),
    rewardStep: 'draft',
  }
}

export function acceptRewardSecret(run: RunState, secret: SecretId): RunState {
  if (!run.offeredSecrets.includes(secret) || !run.pendingDirective) return run
  return {
    ...run,
    arsenal: [...run.arsenal, secret],
    directives: [...run.directives, run.pendingDirective],
    offeredSecrets: [],
    pendingDirective: null,
    rewardStep: 'equip',
  }
}

export function equipForNextDuel(run: RunState, secret: SecretId): RunState {
  if (!run.arsenal.includes(secret) || run.stage >= 3) return run
  return {
    ...run,
    stage: (run.stage + 1) as RunState['stage'],
    equippedSecret: secret,
  }
}

export function buildMatchSetup(
  run: RunState,
  random: () => number = Math.random,
  forcedAiSecrets?: SecretId[],
): MatchSetup {
  if (!run.equippedSecret) throw new Error('nenhuma contramedida equipada')
  const boss = run.stage === 3
  const aiSecrets = forcedAiSecrets ?? sampleWithoutReplacement(SECRET_IDS, boss ? 2 : 1, random)
  return {
    duel: (run.stage + 1) as MatchSetup['duel'],
    boss,
    playerSecret: run.equippedSecret,
    aiSecrets,
    directives: [...run.directives],
  }
}

export function defaultMatchSetup(): MatchSetup {
  return {
    duel: 1,
    boss: false,
    playerSecret: 'observador-observado',
    aiSecrets: ['efeito-zeno'],
    directives: [],
  }
}

export function publicDirectiveSet(directives: readonly DirectiveId[]): Set<DirectiveId> {
  return new Set(directives)
}
