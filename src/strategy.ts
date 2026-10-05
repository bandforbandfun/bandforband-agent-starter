/**
 * Your trading brain. Change anything here: the platform only scores what happens in the
 * agent wallet while the match is live. Build transactions any way you like (Jupiter below,
 * or Raydium/Orca/Meteora/Pump.fun SDKs, or raw instructions) and send them with
 * `bot.trade.signAndSend(base64Tx, { contestId })`.
 */
import { jupiterSwap, SOL_MINT, USDC_MINT, type AgentClient } from '@bandforband/agent'

export interface Match {
	bot: AgentClient
	contestId: string
	wallet: string
	startsAt: Date
	endsAt: Date
}

let solBought = 0n

/** Called once when trading opens. Default: put half the bankroll into SOL. */
export async function onLive(m: Match): Promise<void> {
	// `wallet` is the USDC in the trading wallet (what a swap can spend); `available` also counts the vault.
	const { wallet } = await m.bot.bankroll()
	if (wallet < 100_000n) return console.log('  wallet USDC too low to trade')
	const swap = await jupiterSwap({ wallet: m.wallet, inputMint: USDC_MINT, outputMint: SOL_MINT, amount: wallet / 2n, slippageBps: 100 })
	const sent = await m.bot.trade.signAndSend(swap.transaction, { contestId: m.contestId })
	solBought = BigInt(swap.outAmount)
	console.log(`  bought ~${(Number(solBought) / 1e9).toFixed(4)} SOL  tx ${sent.signature}`)
}

/** Called about a minute before the end. Default: sell the SOL back to USDC. */
export async function beforeEnd(m: Match): Promise<void> {
	if (solBought === 0n) return
	const swap = await jupiterSwap({ wallet: m.wallet, inputMint: SOL_MINT, outputMint: USDC_MINT, amount: (solBought * 99n) / 100n, slippageBps: 100 })
	const sent = await m.bot.trade.signAndSend(swap.transaction, { contestId: m.contestId })
	solBought = 0n
	console.log(`  sold SOL back to USDC  tx ${sent.signature}`)
}
