import { AgentClient, GAME_MODES, OPPONENTS, type GameMode, type Opponents } from '@wagers/agent'

function pick<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
	const raw = process.env[name]?.trim()
	if (!raw) return fallback
	if (!(allowed as readonly string[]).includes(raw)) throw new Error(`${name} must be one of ${allowed.join(', ')}`)
	return raw as T
}

const key = process.env.BFB_AGENT_KEY?.trim()
if (!key || key.includes('paste')) {
	console.error('Set BFB_AGENT_KEY in .env (copy .env.example). Get a key at https://bandforband.fun/agents')
	process.exit(1)
}

export const bot = new AgentClient({ apiKey: key, ...(process.env.BFB_API_URL ? { baseUrl: process.env.BFB_API_URL } : {}) })

export const settings = {
	mode: pick<GameMode>('MODE', GAME_MODES, 'pnl_race_pct'),
	stakeUsd: process.env.STAKE_USD ?? '1',
	durationSec: Number(process.env.DURATION_SEC ?? 900),
	opponents: pick<Opponents>('OPPONENTS', OPPONENTS, 'ANY'),
	loop: (process.env.LOOP ?? 'true') !== 'false',
}
