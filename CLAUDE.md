# Craps project

A craps game. `engine.js` is the rules engine (pure JavaScript, no DOM). `index.html` is the table UI that uses it.
Goal: a practice table modeled on crapsee.com.

## Commands
- Run tests: `npm test` (uses Node's built-in test runner, no dependencies)
- Run the game: open `index.html` in a browser

## Rules for working here
- Keep game logic in `engine.js`. It must never touch the DOM. UI code stays in `index.html`.
- Every bet or payout change needs a unit test in `test/engine.test.js`. Work out the expected number by hand first, then write the test.
- Run `npm test` before every commit. Do not commit with failing tests.
- Make small changes and commit after each one that works, with a clear message.
- For anything larger than one bet type, explain the plan and wait for approval before writing code.
- Plain JavaScript, no frameworks or build step unless I ask for one.

## Rules already built (see tests for exact payouts)
- Pass / Don't pass (12 is a push), free odds up to 2x (`maxOdds`).
- Come / Don't come travel to their number on the next roll; odds on them are off on a come-out roll.
- Place pays 9:5 (4,10), 7:5 (5,9), 7:6 (6,8). Buy (4,5,9,10) pays true odds minus 5% of the bet on a win. Lay pays inverse true odds minus 5% of the win. Place/buy/lay are off on a come-out roll and stay up after a win.
- Seven-out resets the shooter.

- Field pays 1:1 on 3,4,9,10,11 and 2:1 on 2 and 12 (options `field2Pays`, `field12Pays`).
- One-roll props: Any seven 4:1, Any craps 7:1, Aces (2) 30:1, Boxcars (12) 30:1, Ace-deuce (3) 15:1, Yo (11) 15:1.
- Hardways: hard 4/10 pay 7:1, hard 6/8 pay 9:1; lose on the easy way or a 7; stay up after a win; work on the come-out by default (`hardwaysWorkOnComeout`).
- `roll()` returns the dice and total, and the roller supplies both dice, so bets can depend on exact dice.

- Stats (`g.stats`, `g.srr()`, `g.sor()`, `g.net()`, `g.shooterNet()`, `g.equity()`): shooters, rolls, roll distribution, roll log with per-roll net. "Bankroll" = rack + money on the table; NET = bankroll minus starting bankroll; the "Shooter" figure holds the last shooter's result until the next shooter rolls.
- Shooter summary (`g.stats.shooterLog`): per shooter P = points made, R = rolls, net. Bets placed after a seven-out do not change the last shooter's net (confirmed on Crapsee).
- Chips larger than the rack are hidden in the UI (as on Crapsee).
- SRR = rolls / sevens (matches Crapsee). SOR is PROVISIONAL: currently (rolls - sevenOuts) / sevenOuts, which matches the one Crapsee screenshot we have (2 rolls, 1 seven-out = 1.00). Confirm with more data.

## Not built yet
1. The Across / Inside / Outside / Field tallies from the Crapsee stats panel. Observed: after a 10: Across 0, Inside -1, Outside +1, Field +1. Then after a 7: Across 0, Inside -1, Outside 0, Field 0. Rules unknown; need more screenshots.
2. General hop bets (any specific dice combination).
3. UI polish to look like a real table; hide chips larger than the rack; optional UI switches for the come-out options.
