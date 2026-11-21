/* Craps engine: pure JavaScript, no DOM. Used by index.html and the tests. */
const Craps = (() => {
  const PASS_ODDS = {4:[2,1],10:[2,1],5:[3,2],9:[3,2],6:[6,5],8:[6,5]}; // true-odds payouts
  const PLACE_PAYS = {4:[9,5],10:[9,5],5:[7,5],9:[7,5],6:[7,6],8:[7,6]}; // place bet payouts
  const COMMISSION = 0.05; // buy: 5% of the bet on a win; lay: 5% of the win
  const HARD_PAYS = {4:[7,1],10:[7,1],6:[9,1],8:[9,1]}; // hardways payouts
  // One-roll bets: the roll either wins (pays the ratio) or loses. Field pays per total (see fieldPay).
  const ONE_ROLL = {
    field:    { wins:[2,3,4,9,10,11,12], pay:[1,1] },
    anySeven: { wins:[7],      pay:[4,1] },
    anyCraps: { wins:[2,3,12], pay:[7,1] },
    two:      { wins:[2],      pay:[30,1] }, // aces
    three:    { wins:[3],      pay:[15,1] }, // ace-deuce
    eleven:   { wins:[11],     pay:[15,1] }, // yo
    twelve:   { wins:[12],     pay:[30,1] }, // boxcars
  };
  const DICE = {2:[1,1],3:[1,2],4:[2,2],5:[2,3],6:[3,3],7:[3,4],8:[4,4],9:[4,5],10:[5,5],11:[5,6],12:[6,6]};
  const r2 = n => Math.round(n * 100) / 100;
  const randomRoller = () => [1 + Math.floor(Math.random()*6), 1 + Math.floor(Math.random()*6)];
  const fixed = totals => { let i = 0; return () => DICE[totals[i++]]; }; // scripted dice for tests

  function createGame(opts = {}) {
    const roller = opts.roller || randomRoller;
    const maxOdds = opts.maxOdds ?? 2;
    const hardwaysWorkOnComeout = opts.hardwaysWorkOnComeout ?? true; // like the "Hardways on" switch on Crapsee
    const fieldPay = t => t === 2 ? [opts.field2Pays ?? 2, 1] : t === 12 ? [opts.field12Pays ?? 2, 1] : [1, 1];
    const placeOffOnComeout = opts.placeOffOnComeout ?? true; // place / buy / lay are off on come-out rolls
    const oddsOffOnComeout = opts.oddsOffOnComeout ?? true; // standard house rule for come-bet odds
    const g = { phase:"comeout", point:null, bankroll: opts.bankroll ?? 500, rolls:0, shooterRolls:0,
                bets:{ pass:0, dontPass:0, passOdds:0, dontPassOdds:0, come:0, dontCome:0,
                ...Object.fromEntries(Object.keys(ONE_ROLL).map(k => [k, 0])) },
                comeBets:{}, dcBets:{}, place:{}, buy:{}, lay:{}, hard:{} }; // place / buy / lay: { number: amount } // numbered come / don’t come bets: { number: {bet, odds} }
    const err = error => ({ ok:false, error });

    // ---- money and statistics ----
    g.startBankroll = g.bankroll; g.shooterStart = g.bankroll;
    g.stats = { rolls:0, shooters:0, sevens:0, sevenOuts:0, dist:{2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0}, log:[], shooterLog:[] };
    g.atRisk = () => { // all money currently on the table
      let t = 0;
      for (const k in g.bets) t += g.bets[k];
      for (const m of [g.comeBets, g.dcBets]) for (const n in m) t += m[n].bet + m[n].odds;
      for (const k of ["place","buy","lay","hard"]) for (const n in g[k]) t += g[k][n];
      return r2(t);
    };
    g.equity = () => r2(g.bankroll + g.atRisk());          // rack + bets (Crapsee "Bankroll")
    g.net = () => r2(g.equity() - g.startBankroll);          // Crapsee "NET"
    g.shooterNet = () => r2(g.equity() - g.shooterStart);    // result of the current / last shooter
    g.srr = () => g.stats.sevens ? r2(g.stats.rolls / g.stats.sevens) : 0;             // rolls per seven
    g.sor = () => g.stats.sevenOuts ? r2((g.stats.rolls - g.stats.sevenOuts) / g.stats.sevenOuts) : 0; // PROVISIONAL: rolls before the seven-out, per seven-out

    g.bet = (type, amt, num) => {
      if (!(amt > 0)) return err("Bet must be more than 0.");
      if (!(type in g.bets) && !["comeOdds","dontComeOdds","place","buy","lay","hard"].includes(type)) return err("Unknown bet.");
      if (amt > g.bankroll) return err("Not enough bankroll.");
      if (type in ONE_ROLL) { // field and propositions: one roll, then gone
        g.bankroll = r2(g.bankroll - amt); g.bets[type] = r2(g.bets[type] + amt);
        return { ok:true };
      }
      if (type === "hard") {
        if (![4,6,8,10].includes(num)) return err("Hardways are on 4, 6, 8 or 10.");
        g.hard[num] = r2((g.hard[num] || 0) + amt); g.bankroll = r2(g.bankroll - amt);
        return { ok:true };
      }
      if (type === "place" || type === "buy" || type === "lay") {
        const allowed = type === "buy" ? [4,5,9,10] : [4,5,6,8,9,10];
        if (!allowed.includes(num)) return err(type === "buy" ? "Buy bets are on 4, 5, 9 or 10." : "Pick 4, 5, 6, 8, 9 or 10.");
        g[type][num] = r2((g[type][num] || 0) + amt);
        g.bankroll = r2(g.bankroll - amt);
        return { ok:true };
      }
      if (type === "come" || type === "dontCome") {
        if (g.phase !== "point") return err("Come bets can only be placed after a point is set.");
      } else if (type === "comeOdds" || type === "dontComeOdds") {
        const e = (type === "comeOdds" ? g.comeBets : g.dcBets)[num];
        if (!e) return err("No come bet on that number yet.");
        if (e.odds + amt > e.bet * maxOdds) return err("Maximum odds is " + maxOdds + "x the bet.");
        g.bankroll = r2(g.bankroll - amt); e.odds = r2(e.odds + amt);
        return { ok:true };
      } else if (type === "pass" || type === "dontPass") {
        if (g.phase !== "comeout") return err("Line bets can only be placed on the come-out roll.");
      } else {
        const line = type === "passOdds" ? "pass" : "dontPass";
        if (g.phase !== "point") return err("Odds can only be added after a point is set.");
        if (!g.bets[line]) return err("Place the matching line bet first.");
        if (g.bets[type] + amt > g.bets[line] * maxOdds) return err("Maximum odds is " + maxOdds + "x the line bet.");
      }
      g.bankroll = r2(g.bankroll - amt);
      g.bets[type] = r2(g.bets[type] + amt);
      return { ok:true };
    };

    g.takeDown = () => { // return all place / buy / lay bets to the bankroll
      let back = 0;
      for (const k of ["place","buy","lay","hard"]) { for (const n in g[k]) back += g[k][n]; g[k] = {}; }
      g.bankroll = r2(g.bankroll + back); return back;
    };

    g.roll = () => {
      const dice = roller(), total = dice[0] + dice[1], events = [], b = g.bets;
      const before = g.equity();
      if (g.shooterRolls === 0) { // a new shooter starts
        g.stats.shooters++; g.shooterStart = before;
        g.stats.shooterLog.unshift({ shooter:g.stats.shooters, points:0, rolls:0, net:0 });
      }
      g.rolls++; g.shooterRolls++;
      const rollNo = g.shooterRolls;
      const pointMade = g.phase === "point" && total === g.point; // shooter makes the point
      const resolve = (k, a, res, ratio = [1,1], num) => {
        if (!a) return;
        let net = 0;
        if (res === "win") { net = r2(a * ratio[0] / ratio[1]); g.bankroll = r2(g.bankroll + a + net); }
        else if (res === "push") g.bankroll = r2(g.bankroll + a);
        else net = -a;
        events.push({ bet:k, num, result:res, net });
      };
      const settle = (k, res, ratio) => { resolve(k, b[k], res, ratio); b[k] = 0; };
      // Traveled come bets are checked first, so a new bet isn’t hit by the roll that moves it.
      const off = oddsOffOnComeout && g.phase === "comeout"; // come odds don’t work on a come-out roll
      for (const n of Object.keys(g.comeBets)) {
        const e = g.comeBets[n], hit = total === +n;
        if (!hit && total !== 7) continue;
        resolve("come", e.bet, hit ? "win" : "lose", [1,1], +n);
        resolve("comeOdds", e.odds, off ? "push" : hit ? "win" : "lose", PASS_ODDS[n], +n);
        delete g.comeBets[n];
      }
      for (const n of Object.keys(g.dcBets)) {
        const e = g.dcBets[n], hit = total === +n, [x, y] = PASS_ODDS[n];
        if (!hit && total !== 7) continue;
        resolve("dontCome", e.bet, hit ? "lose" : "win", [1,1], +n);
        resolve("dontComeOdds", e.odds, off ? "push" : hit ? "lose" : "win", [y, x], +n);
        delete g.dcBets[n];
      }
      // Newly placed come bets: first roll acts like a come-out roll, then the bet travels to its number.
      if (b.come) {
        if (total === 7 || total === 11) settle("come","win");
        else if (total === 2 || total === 3 || total === 12) settle("come","lose");
        else { const e = g.comeBets[total] || (g.comeBets[total] = { bet:0, odds:0 }); e.bet = r2(e.bet + b.come); b.come = 0; }
      }
      if (b.dontCome) {
        if (total === 7 || total === 11) settle("dontCome","lose");
        else if (total === 2 || total === 3) settle("dontCome","win");
        else if (total === 12) settle("dontCome","push");
        else { const e = g.dcBets[total] || (g.dcBets[total] = { bet:0, odds:0 }); e.bet = r2(e.bet + b.dontCome); b.dontCome = 0; }
      }
      const stay = (k, n, net) => { g.bankroll = r2(g.bankroll + net); events.push({ bet:k, num:n, result:"win", net }); };
      const drop = (k, n) => { events.push({ bet:k, num:+n, result:"lose", net:-g[k][n] }); delete g[k][n]; };
      // Field and propositions: decided by this one roll.
      for (const k of Object.keys(ONE_ROLL)) {
        if (!b[k]) continue;
        if (ONE_ROLL[k].wins.includes(total)) settle(k, "win", k === "field" ? fieldPay(total) : ONE_ROLL[k].pay);
        else settle(k, "lose");
      }
      // Hardways: win on the hard way (doubles), lose on the easy way or a 7. Winning bets stay up.
      if (hardwaysWorkOnComeout || g.phase !== "comeout") {
        for (const n of Object.keys(g.hard)) {
          if (total === +n && dice[0] === dice[1]) stay("hard", +n, r2(g.hard[n] * HARD_PAYS[n][0] / HARD_PAYS[n][1]));
          else if (total === +n || total === 7) drop("hard", n);
        }
      }
      // Place / buy / lay: off on come-out rolls by default; winning bets stay up.
      if (!(placeOffOnComeout && g.phase === "comeout")) {
        for (const n of Object.keys(g.place)) {
          if (total === +n) stay("place", +n, r2(g.place[n] * PLACE_PAYS[n][0] / PLACE_PAYS[n][1]));
          else if (total === 7) drop("place", n);
        }
        for (const n of Object.keys(g.buy)) {
          if (total === +n) stay("buy", +n, r2(g.buy[n] * PASS_ODDS[n][0] / PASS_ODDS[n][1] - g.buy[n] * COMMISSION));
          else if (total === 7) drop("buy", n);
        }
        for (const n of Object.keys(g.lay)) { // lay wins on 7, loses when its number rolls
          const win = g.lay[n] * PASS_ODDS[n][1] / PASS_ODDS[n][0];
          if (total === 7) stay("lay", +n, r2(win - win * COMMISSION));
          else if (total === +n) drop("lay", n);
        }
      }
      let sevenOut = false;
      if (g.phase === "comeout") {
        if (total === 7 || total === 11) { settle("pass","win"); settle("dontPass","lose"); }
        else if (total === 2 || total === 3) { settle("pass","lose"); settle("dontPass","win"); }
        else if (total === 12) { settle("pass","lose"); settle("dontPass","push"); }
        else { g.phase = "point"; g.point = total; }
      } else if (total === g.point) {
        settle("pass","win"); settle("passOdds","win", PASS_ODDS[g.point]);
        settle("dontPass","lose"); settle("dontPassOdds","lose");
        g.phase = "comeout"; g.point = null;
      } else if (total === 7) {
        const [n, d] = PASS_ODDS[g.point];
        settle("pass","lose"); settle("passOdds","lose");
        settle("dontPass","win"); settle("dontPassOdds","win", [d, n]); // lay odds pay the inverse
        g.phase = "comeout"; g.point = null; g.shooterRolls = 0; sevenOut = true;
      }
      const st = g.stats;
      st.rolls++; st.dist[total]++;
      if (total === 7) st.sevens++;
      if (sevenOut) st.sevenOuts++;
      st.log.unshift({ shooter:st.shooters, roll:rollNo, dice, total, net: events.length ? r2(g.equity() - before) : null });
      if (st.log.length > 200) st.log.pop();
      const sh = st.shooterLog[0]; // Shooter tab: points made (P), rolls (R), net
      sh.rolls = rollNo; if (pointMade) sh.points++; sh.net = r2(g.equity() - g.shooterStart);
      return { dice, total, events, sevenOut, phase:g.phase, point:g.point };
    };
    return g;
  }
  return { createGame, fixed };
})();

if (typeof module !== "undefined") module.exports = Craps; // lets Node load it
