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
- Point made (confirmed by the player on Crapsee): the pass line bet is paid 1:1 and stays up; the pass odds are paid at true odds and come down.
- A winning pass line bet is paid and stays up (a come-out 7 left the $5 on the line). It is lost on the next seven-out like any other bet. `g.reduce(type, amt, num)` takes chips off a bet (UI: Shift+click reduces by the selected chip, to zero at most, stake returned); `g.remove` takes the whole bet down. Contract bets cannot be reduced: the pass line once a point is set, and come bets traveled to a number (their odds can be). Waiting come, don\'t pass, don\'t come (even traveled), odds, place, buy, lay, hardways, field and props can.
- Crapsee switches the Hardways and Bets switches OFF after a seven-out and ON again once a point is set. The engine matches this: hardways, place, buy and lay are off on a come-out roll by default (options `hardwaysWorkOnComeout`, `placeOffOnComeout`). The very first come-out of a session showed the switches ON; we ignore that.
- UI (`index.html`, v0.11): a Crapsee-style table. Chips are drawn on the bet spots (colour by size), numbered cells hold DC bet/odds, LAY, the number band with the point puck, come bet/odds, PLACE/BUY. Props and hardways panel, Come/Field/Don\'t Pass/Pass Line on the right, dice-face roll history and a Shooter tab (P, R, net) in the side panel, Bets and Hardways switches (`g.switches`, `g.setSwitch`), Outside/Inside/Across place buttons, Down, New game. Not built: Repeat, Undo, 6 & 8, Increase/Decrease, the locks.
- Stay-up rules (v0.12, from the player): don't pass stays up after a come-out 2, 3 (paid) and 12 (push, nothing moves). A waiting don't come bet stays up after 2, 3 (paid) and 12 (push); it comes down on 7 or 11. A waiting come bet stays up after an 11 (paid); it comes down on 2, 3, 12. Odds exist only while a point is on, so there are none to carry through a come-out roll.
- Come-bet auto-replace (v0.12, option `autoReplaceCome`, default on): when a come bet on a number is paid and an equal-sized waiting come bet travels to that same number on the same roll, the engine puts the first bet's odds back on the new bet and puts a new waiting come bet down (all taken from the rack), so only the winnings change. Example: $25 come with $25 odds on the 6 and a $25 come waiting; a 6 rolls; the player is paid and the table looks the same. A different amount means nothing is replaced. This explains rolls 9 and 13 of the recorded session, so the replay no longer places those bets by hand. Confirmed by the player: ONLY come bets are replaced; don't come bets never are. A don't pass bet also stays up, unchanged, after a come-out 12.
- UI changes in v0.13 (from the player): the selected chip has a solid yellow border and glow; after Roll a black window with two big dice and the stickman call (e.g. "Fever five, no field five" for a 5) shows for 2 seconds; `.die` and `.spot` use the player's own CSS (45px fantasy dice, 18px spot text); the Don't Come Bar's OFF puck is a black circle with white text and a solid white border at the bar's top-right corner. The calls in `CALLS` are standard stickman calls; only the 5 was in the player's screenshot.
- Crapsee behaviors confirmed from screenshots: winnings are truncated to the cent (place 6 $1 pays 1.16); winning one-roll bets (field, props) are paid and stay up, losing ones come down; winning come bets are paid and come down, and the waiting come bet moves to that number on the same roll; hard 4 won twice and stayed up; DC and its lay odds lose together when the number repeats.

## Not built yet
1. How don't pass and its odds behave after a win (don't pass wins on a come-out 2 or 3, or on a seven-out). We keep the line bet up and pay the odds, as for pass.
2. General hop bets (any specific dice combination).
3. UI polish to look like a real table; hide chips larger than the rack; optional UI switches for the come-out options.
