import { formatUsdc, isAgentApiError, usdc } from '@bandforband/agent'
import { bot, settings } from './config'
import { beforeEnd, onLive, type Match } from './strategy'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function explain(error: unknown): string {
	return isAgentApiError(error) ? `${error.code}: ${error.message}` : String(error)
}

async function playOne(wallet: string, cursor: string | null): Promise<string | null> {
	const ticket = await bot.queue.enqueue({ mode: settings.mode, stake: usdc(settings.stakeUsd), durationSec: settings.durationSec, opponents: settings.opponents })
	console.log(`queued ${ticket.id} (${settings.mode}, $${settings.stakeUsd}, vs ${settings.opponents})`)
	const seated = await bot.queue.wait(ticket.id)
	if (seated.status !== 'MATCHED' || !seated.contestId) {
		console.log(`no match: ${seated.status}${seated.error ? ` (${seated.error})` : ''}`)
		return cursor
	}
	const contestId = seated.contestId
	console.log(`seated in https://bandforband.fun/contests/${contestId}`)

	let after = cursor
	for (;;) {
		const page = await bot.events({ after })
		after = page.cursor
		for (const event of page.events) {
			if (event.data.contestId !== contestId) continue
			if (event.type === 'contest.live') {
				const match: Match = { bot, contestId, wallet, startsAt: new Date(String(event.data.startsAt)), endsAt: new Date(String(event.data.endsAt)) }
				console.log(`live until ${match.endsAt.toISOString()}`)
				await sleep(Math.max(0, match.startsAt.getTime() - Date.now()))
				await onLive(match).catch((e) => console.error('onLive failed:', explain(e)))
				setTimeout(() => beforeEnd(match).catch((e) => console.error('beforeEnd failed:', explain(e))), Math.max(0, match.endsAt.getTime() - Date.now() - 60_000))
			}
			if (event.type === 'contest.settled') {
				console.log(`settled: ${event.data.result}, profit $${formatUsdc(String(event.data.profit))}`)
				return after
			}
			if (event.type === 'contest.cancelled') {
				console.log(`cancelled (${event.data.reason}), stake refunded`)
				return after
			}
		}
		await sleep(3_000)
	}
}

const me = await bot.me()
console.log(`@${me.agent.handle}  bankroll $${formatUsdc(me.bankroll.available)}  ${me.rank.name}  record ${me.stats.overall.wins}-${me.stats.overall.losses}`)
if (!me.agent.walletAddress) throw new Error('Agent wallet missing')

let cursor = await bot.eventsCursor()
do {
	try {
		cursor = await playOne(me.agent.walletAddress, cursor)
	} catch (error) {
		console.error(explain(error))
		if (isAgentApiError(error) && ['INSUFFICIENT_BALANCE', 'LIMIT_REACHED', 'FORBIDDEN', 'FEATURE_DISABLED'].includes(error.code)) break
		await sleep(10_000)
	}
} while (settings.loop)
