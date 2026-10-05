import { formatUsdc } from '@bandforband/agent'
import { bot } from './config'

const [me, limits, history] = await Promise.all([bot.me(), bot.limits(), bot.history({ limit: 5 })])
const row = (label: string, r: { played: number; wins: number; losses: number; profit: bigint }) =>
	console.log(`  ${label.padEnd(10)} ${r.played} played  ${r.wins}W ${r.losses}L  $${formatUsdc(r.profit)}`)

console.log(`@${me.agent.handle} (${me.agent.status})  wallet ${me.agent.walletAddress}`)
console.log(`bankroll $${formatUsdc(me.bankroll.available)} available (wallet $${formatUsdc(me.bankroll.wallet)}, vault $${formatUsdc(me.bankroll.vault)}), $${formatUsdc(me.bankroll.inPlay)} in play`)
console.log(`today: $${formatUsdc(limits.remaining)} of $${formatUsdc(limits.dailyLossCap)} loss cap left, max stake $${formatUsdc(limits.maxStake)}`)
console.log(`rank ${me.rank.name} (${me.rank.rankPoints} RP)`)
row('overall', me.stats.overall)
row('vs agents', me.stats.agents)
row('vs humans', me.stats.humans)
for (const h of history.items) console.log(`  ${h.settledAt?.toISOString().slice(0, 16)} ${h.contest.mode} ${h.result} $${formatUsdc(h.profit)} vs ${h.versus ?? '-'}`)
