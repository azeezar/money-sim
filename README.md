# Money Sim (working title)

A gamified saving and investing education app, with a virtual portfolio and a trading simulator. Everything is **virtual money**: nothing connects to a bank, broker or real funds. It is education, not financial advice.

Works as a phone-sized app and a desktop web app from one codebase (responsive React). Progress is saved in the browser (`localStorage`).

## Run it

There are two builds from one codebase:

| | Regular user | Administrator |
| --- | --- | --- |
| Dev server | `npm run dev` (http://localhost:5173) | `npm run dev:admin` (http://localhost:5175) |
| Production build | `npm run build` → `dist/` | `npm run build:admin` → `dist-admin/` |
| Single HTML file | `npm run build:single` → `dist-single/` | `npm run build:single:admin` → `dist-single-admin/` |

The **admin build** opens every tier, lesson and the trading simulator, and adds an **Admin** tab that edits XP, stars, hearts, streak, goals, budget, simulator cash, badges and lesson progress, plus a raw JSON editor for the whole saved state. It saves under its own storage key, so it never touches a regular user's progress. Do not deploy the admin build publicly.

```bash
npm install
npm test             # unit tests
npm run build:all    # both production builds
```

## What is in it

- **Welcome screen** on every app open: **Start** sets up a new profile (asks first if one is already saved on this device), **Log in** continues the profile saved on this device. There are no passwords or cloud accounts yet; progress lives on the device.
- **Starting quiz**: four questions (goal, timeline, knowledge, reaction to a 20% drop), then virtual starting amount, income, monthly saving and a savings goal. The "how much do you know" answer gives a head start on tiers.
- **Mascots**: six to choose from (Penny, Rusty, Lily, Bamboo, Pip, Bolt). Pick at onboarding, change any time in Rewards.
- **Learn, a 32-lesson curriculum** in four tiers of four units (two lessons each, 7–10 minutes): Novice — Financial Foundations (income and leaks, 50/30/20, APY, emergency funds, APR, avalanche vs. snowball, inflation, first investing steps); Intermediate — Core Investor (shares, bonds, index funds, fees, allocation, tax wrappers, DCA, rebalancing); Advanced — Market Analyst (statements, free cash flow, multiples, DCF, central banks, yield curves, biases, crashes); Investor — Sophisticated Strategist (options, theta, cap rates, property leverage, private markets, correlation, tax-loss harvesting, decumulation). Tiers unlock by XP. **My plan** is separate, always open, and written from the user's own goal, budget and quiz answers.
- **My pot**: savings goal plus a **budget planner**. Log spends by category, close the month, and the saving joins the pot. Hitting the monthly savings goal pays XP.
- **Interactive mechanics**: each curriculum lesson has a hands-on activity between the teaching and the questions (e.g. Swipe-Sorter, Pie Slider, Dual-Race Simulator). Built so far: all 8 Novice ones. Lessons whose mechanic is not built yet skip that step.
- **Minigames**: every lesson has its own arcade game, listed by tier and unit and opened by XP like the lessons (built so far: all 8 Novice and all 8 Intermediate ones; the rest show “Soon”). Each tier also has Term Match and Quick Quiz built from its lessons, and Intermediate keeps Risk Lab. Arcade games and Risk Lab level up with XP from the wallet (12% faster per level).
- **Date of birth**: asked at sign-up (and once for older saves); the app works out the age from it. Under 18: no Trade tab, arcade games open only once their lesson is finished and run at a gentler pace, and the review games have no timers and use only finished lessons. Change it in the admin build to preview either mode.
- **Lessons** open with a "Learn first" page (every teaching card plus a key-terms list) before the questions.
- **Unlock alerts**: crossing an XP threshold shows a toast straight away (even mid-lesson), then a pop-up saying the next tier is unlocked, plus the Portfolio and Trade once each, and what opens next.
- **Portfolio** (opens at Intermediate): a Trading 212-style account. The user picks a starting balance from £1 to £10,000 with a slider (£10 steps, default £10,000), and returns are measured from it. Value and return, allocation donut, holdings, an Explore list, instrument pages and a buy/sell sheet with an amount slider up to the cash or holding available.
- **Trade** (opens at the Investor tier, 18+ only): a TradingView-style simulator with two separate accounts:
  - **24-hour market**: everything moves all day, every day.
  - **UK market hours**: shares and funds trade 08:00–16:30 London time, Monday to Friday (bank holidays not modelled). Prices freeze when closed and gap at the open; market orders are refused while closed, limit/stop orders wait. Crypto and gold stay 24/7.
  - Starting balance slider: £10 to £100,000 in £10 steps (admin build: up to £1,000,000,000, with a number box).
  - **News** (button beside the market switch): random daily stories per company and coin (about 30% chance each, and never fewer than 2 a day in total); each story moves the price the next day (from the next open for shares). News effects start on 1 Oct 2026, so older prices are unchanged.
  - **Leverage** on buys: none, 2×, 5×, 25× or 50×. Only the margin (value ÷ leverage) comes out of cash; the 0.1% commission is on the full value. A leveraged position is closed automatically (liquidated) when the price falls by 1 ÷ leverage, and losses never exceed the margin. One leverage level per position.
  - **Replay** the last day, week or month at 1 min/s to 4 hr/s with a practice account that is not saved.
  - **Fast-forward** a day, week or month: moves that account's clock ahead, fills orders on the way and shows the result.
  - **Back to today** (shown while replaying or fast-forwarded): returns to the present at once. After a fast-forward it restores the account exactly as it was before the first jump, wiping every fill and trade since (asks twice).
  - 25 companies across 25 industries, 4 cryptos (BTCX, ETHX, SOLX, DOGX), funds, gold, plus the **VRMNY** easter egg whose prices and headlines are set by hand in `src/data/vermany.ts`.
  - Charts: 7 timeframes, 6 chart types, 11 indicators, horizontal lines, market/limit/stop orders with stop loss and take profit, positions, history, account stats, a position size calculator and a Resources glossary.
- **Profile**: virtual net worth, budget goals, learning progress per tier, reading progress, badges, buddy, theme and data reset.
- **Reading list**: 16 suggested books on the Learn tab, with a "read" tick.
- **Light and dark**: white light theme by default; dark mode from the moon button or Profile.

## The XP economy

| Thing | Earned from | Used for |
| --- | --- | --- |
| **XP (lifetime)** | Lessons, daily quests, budget months | Unlocks learning tiers. Never goes down. |
| **XP wallet** | Every XP earned also lands here | Moved into minigames to level them up |
| **Stars** | Minigame plays, quests | Refill hearts in lessons |

Tier unlocks: Novice 0, Intermediate 60, Advanced 150, Investor 270 XP (the Investor tier also opens the trading simulator). Minigame level costs: 20, 40, 60, 80, 100 XP (300 for max). Budget month: 5 XP for closing, 40 more for hitting the goal, 20 more for saving 20% over it.

All the numbers live in `src/lib/config.ts`.

## Layout

```
src/
  lib/       config (economy numbers), progress rules, budget maths, formatting   (pure, tested)
  state/     types, store (localStorage), actions, quest + badge settling
  data/      curriculum (32 lessons), lessons (helpers + My plan), badges, quests, quiz and profiles
  mechs/     interactive lesson mechanics and their maths (sims.ts)
  games/     arcade/ (shared canvas engine + arcade games), Term Match, Quick Quiz, Risk Lab
  lib/       ...plus market (simulated prices), trading (order rules), indicators, mode (admin flag)
  screens/   Onboarding, Learn, Lesson, Pot (budget planner), Portfolio, Trade, Games, Profile, Admin
  components/ Mascot, XpBar, Quests, Toasts
```

## Adding lessons

Curriculum lessons live in `src/data/curriculum.ts` (`cur(number, title, minutes, mechanic, arcade, steps)` inside a `unit(...)`); register a built mechanic in `src/mechs/index.ts` and an arcade game in `src/games/arcade/index.ts` under the same id. My plan lessons are in `src/data/lessons.ts`. A lesson is a list of steps: `card`, `mc` (first option is the correct one, the UI shuffles), `tf`, `match`. The "My plan" lessons are functions that receive the user's numbers (`PlanCtx`). `lessons.test.ts` checks every lesson renders sensibly across a range of user states.

## Known limits of phase 1

- **Content is a draft.** Have the lessons reviewed by someone qualified, and check the UK-specific parts (ISAs, pensions, FCA) before launch. Other countries need their own versions.
- **Risk Lab odds are invented** for teaching, not market data.
- **Market prices are simulated.** Every price is a deterministic function of symbol and time (layered noise), so it moves live without a server and orders can be checked for time the app was closed. Companies and tickers are invented. The trading simulator is long-only (no short selling).
- **Check UK figures.** ISA allowance, dividend allowance, Personal Savings Allowance and FSCS details are written as of late 2026 and can change.
- **XP can be farmed with virtual numbers.** The budget planner trusts what the user types. `ONE_REWARD_PER_CALENDAR_MONTH` in `config.ts` limits goal-hit XP to once per real calendar month; turn it on for anything real.
- **No accounts or sync.** Data lives in one browser. Clearing site data erases it.
- **Real money is out of scope.** Holding or moving real funds, or bank syncing (Plaid, TrueLayer), brings regulation, security and compliance work that should be planned separately.

## Next steps

1. Accounts and a database so progress follows the user across devices.
2. Wrap it as an iOS/Android app (Capacitor) once the web version feels right.
3. A lesson editor and content review workflow.
4. Optional bank syncing for the budget planner.

## iOS app

The `ios/` folder is a Capacitor wrapper around the same web app. It needs Xcode (from the Mac App Store).

```bash
npm run ios        # build the web app, copy it into ios/, open Xcode; press Run to launch a simulator
npm run ios:sync   # rebuild and copy without opening Xcode
```

Run `ios:sync` after every web change. The app id is `com.moneysim.app` (in `capacitor.config.ts`). It still uses the default Capacitor icon.
