const test = require("node:test");
const Craps = require("../engine.js");
const eq = (a, b, m) => { if (a !== b) throw new Error((m || "") + " expected " + b + ", got " + a); };

// A real Crapsee session (screenshots, 2026-11-21): $5 pass line, then lots of side bets, two shooters, 19 rolls.
// Each step: bets placed first, then the dice, then the numbers Crapsee showed (roll net, My Bets, tallies across/inside/outside/field).
const L = [4,5,6,8,9,10], B = [4,5,9,10], H = [4,6,8,10];
const table = [
  ...L.map(n => ["lay",1,n]), ...L.map(n => ["place",1,n]), ...B.map(n => ["buy",1,n]), ...H.map(n => ["hard",1,n]),
  ["field",1], ["anySeven",1], ["anyCraps",1], ["two",1], ["twelve",1], ["three",1], ["eleven",1], ["come",5],
];
const steps = [
  { bets:[["pass",5]],                       dice:[3,5], net:null,   risk:5,    tally:"0,0,0,0" },
  { bets:table,                              dice:[6,6], net:30,     risk:28,   tally:"0,0,-1,0" },
  { bets:[["come",5],["passOdds",5]],        dice:[4,2], net:-3.84,  risk:33,   tally:"0,0,-1,0" },
  { bets:[["comeOdds",5,6],["come",5]],      dice:[6,6], net:-5,     risk:38,   tally:"-1,0,-2,0" },
  { bets:[["dontCome",5]],                   dice:[2,2], net:9.75,   risk:42,   tally:"0,-1,-1,1" },
  { bets:[["dontComeOdds",5,4]],             dice:[3,2], net:1.85,   risk:46,   tally:"0,0,0,0" },
  { bets:[["come",5]],                       dice:[3,2], net:2.85,   risk:51,   tally:"0,0,0,0" },
  { bets:[["comeOdds",5,5]],                 dice:[4,2], net:12.16,  risk:46,   tally:"1,1,0,-1" },
  { bets:[["come",5]],                       dice:[3,2], net:15.35,  risk:null, tally:"1,1,0,-1" },
  { bets:[["field",1]],                      dice:[2,2], net:1.75,   risk:42,   tally:"1,1,1,0" }, // roll 9 already put the odds and a new come bet back (auto-replace)
  { bets:[["comeOdds",5,4]],                 dice:[3,1], net:18.75,  risk:36,   tally:"2,0,2,0" },
  { bets:[["come",5]],                       dice:[4,2], net:0.16,   risk:40,   tally:"2,1,1,0" },
  { bets:[["come",5]],                       dice:[1,5], net:6.16,   risk:null, tally:"2,1,1,-1" },
  { bets:[["field",1]],                      dice:[3,4], net:-31.11, risk:0,    tally:"2,1,1,-1", // roll 13 already put a new come bet back
    after: g => { eq(g.bankroll,558.83); eq(g.net(),58.83); eq(g.shooterNet(),58.83); eq(g.srr(),14); eq(g.sor(),13);
                  eq([4,5,6,7,8,12].map(n => g.stats.dist[n]).join(","), "3,3,4,1,1,2"); } },
  // shooter 2: a come-out 7 (pass wins and stays up), then a point of 4 and a seven-out
  { bets:[["pass",5]],                       dice:[1,6], net:5,      risk:5,    tally:"1,0,0,-2",
    after: g => { eq(g.stats.shooters,2); eq(g.srr(),7.5); eq(g.sor(),13); eq(g.shooterNet(),5); } },
  { bets:[["field",1]],                      dice:[3,1], net:1,      risk:6,    tally:"1,0,1,-1", after: g => { eq(g.srr(),8); eq(g.sor(),13); } },
  { bets:[["remove","field"],["passOdds",5]], dice:[5,6], net:null,  risk:10,   tally:"1,-1,0,-1", after: g => { eq(g.srr(),8.5); eq(g.sor(),14); } },
  { bets:[["hard",1,4]],                     dice:[1,2], net:null,   risk:11,   tally:"0,-1,0,0", after: g => { eq(g.srr(),9); eq(g.sor(),15); } },
  { bets:[["anyCraps",1]],                   dice:[5,2], net:-12,    risk:0,    tally:"-1,-2,0,0",
    after: g => { eq(g.srr(),6.33); eq(g.sor(),8); eq(g.bankroll,552.83); eq(g.net(),52.83); eq(g.shooterNet(),-6);
                  eq(g.stats.shooterLog.map(s => s.shooter + ":" + s.rolls + ":" + s.net).join(" "), "2:5:-6 1:14:58.83"); } },
];

test("replay of a real 19-roll, two-shooter Crapsee session matches every roll net, My Bets and tally", () => {
  let cur; const g = Craps.createGame({ roller: () => cur });
  steps.forEach((s, i) => {
    const id = "roll " + (i + 1);
    s.bets.forEach(b => { const r = b[0] === "remove" ? g.remove(b[1], b[2]) : g.bet(...b); if (!r.ok) throw new Error(id + ": bet " + b.join(",") + " rejected: " + r.error); });
    cur = s.dice; g.roll();
    const entry = g.stats.log[0];
    eq(entry.net === null ? null : entry.net.toFixed(2), s.net === null ? null : s.net.toFixed(2), id + " net");
    if (s.risk !== null) eq(g.atRisk(), s.risk, id + " My Bets");
    eq(["across","inside","outside","field"].map(k => g.tally(k)).join(","), s.tally, id + " tallies");
    if (s.after) s.after(g);
  });
});
