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
- SRR = rolls / sevens (matches Crapsee). SOR = rolls made while a point was on / seven-outs (come-out rolls do not count, so a come-out 7 leaves SOR alone). Verified on 8 Crapsee readings across two shooters. SRR counts every roll and every 7, including a come-out 7.

- Across / Inside / Outside / Field tallies (`g.tally(name)`): group hits minus expected hits, where expected = round-half-up(rolls x ways/36). Groups: across 4,5,6,8,9,10 (24 ways); inside 5,6,8,9 (18); outside 4,5,9,10 (14); field 2,3,4,9,10,11,12 (16). All rolls count, 7s included. Verified against 10 Crapsee rolls plus an earlier 2-roll run. They are session totals: they do NOT reset for a new shooter (verified through roll 19).
- A seven-out clears the whole table: lay bets that win are paid and their stakes returned, anything else is gone (Crapsee showed My Bets 0 after the seven-out). Crapsee also flips its "Bets" and "Hardways" switches to OFF at that point; we have not built those switches.
- `test/crapsee-run.test.js` replays a real 19-roll, two-shooter Crapsee session (every roll net, My Bets, the four tallies, SRR, SOR, shooter nets, final bankroll 552.83). Keep it passing.
- A winning pass line bet is paid and stays up (a come-out 7 left the $5 on the line). It is lost on the next seven-out like any other bet. `g.remove(type, num)` takes one bet down (field, props, place, buy, lay, hard); line bets, odds and traveled come bets cannot be removed.
- Crapsee switches the Hardways and Bets switches OFF after a seven-out and ON again once a point is set. The engine matches this: hardways, place, buy and lay are off on a come-out roll by default (options `hardwaysWorkOnComeout`, `placeOffOnComeout`). The very first come-out of a session showed the switches ON; we ignore that.
- Crapsee behaviors confirmed from screenshots: winnings are truncated to the cent (place 6 $1 pays 1.16); winning one-roll bets (field, props) are paid and stay up, losing ones come down; winning come bets are paid and come down, and the waiting come bet moves to that number on the same roll; hard 4 won twice and stayed up; DC and its lay odds lose together when the number repeats.

## Not built yet
1. What happens to a winning pass line bet when the POINT is made (we keep it up, as Crapsee does after a come-out win, but have not seen it). Also how don't pass wins and odds behave after a win.
2. General hop bets (any specific dice combination).
3. UI polish to look like a real table; hide chips larger than the rack; optional UI switches for the come-out options.
