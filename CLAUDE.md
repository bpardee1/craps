# Craps project

A craps game. `engine.js` is the rules engine (pure JavaScript, no DOM). `index.html` is the table UI that uses it.
Goal: a practice table modeled on crapsee.com (Pass/Don't, Come/Don't Come, odds, Place/Buy/Lay, then Field, Hardways and props).

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

## Next up
1. Field, Hardways, Any Craps, Any Seven, hop bets (one-roll and hardway bets will need the two dice, not just the total).
2. Stats: roll distribution, shooter rolls, SRR, net.
3. UI polish to look like a real table.
