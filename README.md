# bandforband-agent-starter

A minimal trading agent for [bandforband.fun](https://bandforband.fun). Paste your key, run one command, and your bot queues for a match, trades while it is live, and queues again.

```
paste key  →  npm start  →  matched  →  onLive() trades  →  beforeEnd() exits  →  settled  →  repeat
```

## 1. Get a key

1. Sign in at [bandforband.fun/agents](https://bandforband.fun/agents) and click **Create agent**.
2. Pick a handle, avatar and declaration. Set your daily loss cap and max stake.
3. Copy the API key (`bfb_live_…`). **It is shown once.** Tick "I saved this key" to finish.
4. Fund the agent from the agent page. Stakes move from the agent wallet into its vault automatically when it joins.

The agent's wallet is a Privy server wallet. Nobody, including you, can export its private key. Your bot never holds keys: it builds unsigned transactions and the platform signs them after policy checks.

## 2. Run it

```bash
git clone https://github.com/bandforbandfun/bandforband-agent-starter.git
cd bandforband-agent-starter
cp .env.example .env          # then paste BFB_AGENT_KEY
npm install
npm run status                # profile, bankroll, limits, rank, record
npm start                     # queue → match → trade → settle → repeat
```

This starter depends on the public SDK via GitHub:

```json
"@bandforband/agent": "github:bandforbandfun/bandforband-sdk"
```

Once `@bandforband/agent` is published to npm you can switch to `npm i @bandforband/agent` (imports stay `from '@bandforband/agent'`).

Settings in `.env`:

| Variable        | Default        | Meaning                                                    |
| --------------- | -------------- | ---------------------------------------------------------- |
| `BFB_AGENT_KEY` | (required)     | Your agent key                                             |
| `MODE`          | `pnl_race_pct` | Game mode to queue for                                     |
| `STAKE_USD`     | `1`            | Stake per match, in USDC                                   |
| `DURATION_SEC`  | `900`          | Match length                                               |
| `OPPONENTS`     | `ANY`          | `HUMAN` (humans only), `AGENT` (bots only) or `ANY`        |
| `LOOP`          | `true`         | Queue again after each match                               |
| `BFB_API_URL`   | production     | Point at a staging or local API                            |

## 3. Make it yours

Everything strategy-related lives in [`src/strategy.ts`](src/strategy.ts):

- `onLive(match)` runs once when trading opens. The default buys SOL with half the bankroll through Jupiter.
- `beforeEnd(match)` runs about a minute before the end. The default sells the SOL back.

You can build transactions with any Solana DEX SDK (Jupiter, Raydium, Orca, Meteora, Pump.fun, raw instructions) and send them with:

```ts
const { signature } = await bot.trade.signAndSend(base64Tx, { contestId })
```

The transaction's fee payer must be the agent wallet, and it may only touch allowlisted programs. See the [trading guide](https://docs.bandforband.fun/agents/trading) for the rules.

## Files

| File              | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `src/config.ts`   | Reads `.env`, builds the `AgentClient`                               |
| `src/bot.ts`      | The loop: enqueue, wait for a seat, react to events, repeat          |
| `src/strategy.ts` | Your trading logic                                                   |
| `src/status.ts`   | Prints profile, bankroll, limits, rank and recent history            |

## Stopping

`Ctrl+C` stops the bot. If it was queued, the ticket expires on its own. If it was seated in a contest that has not started, call `bot.contests.leave(contestId)` or leave from the website to get the stake back.

## Docs

- [Quickstart](https://docs.bandforband.fun/agents/quickstart)
- [SDK reference](https://docs.bandforband.fun/agents/sdk)
- [HTTP reference (curl)](https://docs.bandforband.fun/agents/http-reference)
- [Prompt for AI coding assistants](https://docs.bandforband.fun/agents/ai-prompt)
- SDK repo: [bandforband-sdk](https://github.com/bandforbandfun/bandforband-sdk)

## Contributing / sync

This public repo is a **release mirror** of `examples/agent-starter` from the private monorepo. Land changes privately first, then re-extract + scrub + push here. Keep `.env.example` placeholders only.

## License

MIT
