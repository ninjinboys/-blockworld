"use strict";

const ClubSim = (() => {
  const roles = { GK: "GK", DF: "DF", MF: "MF", FW: "FW" };
  const roleKeys = Object.keys(roles);
  const divisions = ["プレミアリーグ", "チャレンジリーグ", "地域リーグ"];
  const tactics = {
    balanced: { name: "バランス", note: "中央を固め、好機を待つ。速攻に強い。", attack: 0, defense: 0, fatigue: 8, beats: "counter" },
    press: { name: "ハイプレス", note: "高い位置で奪って攻める。運動量が必要。", attack: .2, defense: -.06, fatigue: 13, beats: "balanced" },
    counter: { name: "カウンター", note: "引いて守り、背後を突く。プレスに強い。", attack: -.06, defense: .14, fatigue: 6, beats: "press" }
  };
  const formations = {
    "4-4-2": { GK: 1, DF: 4, MF: 4, FW: 2 },
    "4-3-3": { GK: 1, DF: 4, MF: 3, FW: 3 },
    "5-3-2": { GK: 1, DF: 5, MF: 3, FW: 2 }
  };
  const rivals = [
    ["北海ノルド", "信州ハイランズ", "湾岸ユニオン", "相模ヴェルデ", "瀬戸内マリナーズ", "鳴門レグルス", "南九州ソル"],
    ["旭川ポラリス", "盛岡トレイル", "常陸ペンタス", "湘南ハーバー", "岐阜オークス", "紀州ファロス", "日向サンズ"],
    ["松江オルカ", "吉備フロンティア", "山口トライデント", "備後ユナイト", "三原イーグルス", "安芸フォレスト", "呉ブルーウェーブ"]
  ];
  const lastNames = ["西原", "岩城", "川瀬", "藤野", "杉浦", "大森", "瀬戸", "谷口", "白石", "水谷", "青柳", "中尾", "堀江", "立花", "桐山", "宮本", "深町", "竹内", "小柳", "久米"];
  const firstNames = ["悠真", "蓮", "快", "翼", "晴人", "航", "涼", "駿", "奏", "拓海", "玲", "新", "真尋", "葵"];
  const rosterRoles = ["GK", "GK", "DF", "DF", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "MF", "MF", "FW", "FW", "FW", "FW"];
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const roll = (random, low, high) => Math.floor(random() * (high - low + 1)) + low;
  const average = (items, value) => items.reduce((sum, item) => sum + value(item), 0) / items.length;

  function makePlayer(id, role, division, random, prospect = false) {
    const age = roll(random, 18, prospect ? 24 : 32);
    const skill = roll(random, 46, 60) + (2 - division) * 8 + (prospect ? 5 : 0);
    return {
      id,
      role,
      name: prospect ? `${lastNames[roll(random, 0, lastNames.length - 1)]} ${firstNames[roll(random, 0, firstNames.length - 1)]}`
        : `${lastNames[id - 1]} ${firstNames[id % firstNames.length]}`,
      age,
      skill,
      potential: clamp(skill + roll(random, 5, age < 24 ? 22 : 13), skill, 94),
      fatigue: 0,
      cost: 180 + Math.max(0, skill - 42) * 28,
      wage: 5 + Math.round(skill / 8)
    };
  }

  function market(state, random) {
    return roleKeys.map(role => makePlayer(state.nextId++, role, state.division, random, true));
  }

  function makeSeason(state, random) {
    const tacticsKeys = Object.keys(tactics);
    state.teams = [
      { id: 0, name: state.name },
      ...rivals[state.division].map((name, index) => ({
        id: index + 1,
        name,
        skill: 43 + (2 - state.division) * 9 + index * 2 + roll(random, 0, 3),
        tactic: tacticsKeys[roll(random, 0, tacticsKeys.length - 1)]
      }))
    ];
    const rotating = state.teams.map(team => team.id);
    const firstHalf = [];
    for (let matchday = 0; matchday < rotating.length - 1; matchday++) {
      const matches = rotating.slice(0, rotating.length / 2).map((team, index) => {
        const other = rotating[rotating.length - 1 - index];
        return (index === 0 ? matchday : index) % 2 === 0 ? [team, other] : [other, team];
      });
      firstHalf.push(matches);
      rotating.splice(1, 0, rotating.pop());
    }
    state.fixtures = firstHalf.concat(firstHalf.map(day => day.map(([home, away]) => [away, home])));
    state.table = state.teams.map(({ id }) => ({ id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
    state.results = [];
    state.round = 0;
    state.trained = false;
    state.market = market(state, random);
  }

  function newClub(random = Math.random) {
    const state = {
      version: 1, name: "広島リバーFC", year: 1, division: 2, balance: 2500,
      formation: "4-4-2", tactic: "balanced", nextId: rosterRoles.length + 1, honors: [],
      squad: rosterRoles.map((role, index) => makePlayer(index + 1, role, 2, random))
    };
    makeSeason(state, random);
    return state;
  }

  function matchForClub(state, day = state.round) {
    const match = state.fixtures[day]?.find(pair => pair.includes(0));
    return match ? { home: match[0] === 0, opponent: state.teams[match.find(id => id !== 0)] } : null;
  }

  function effective(player) {
    return player.skill - player.fatigue * .28;
  }

  function lineup(state) {
    return roleKeys.flatMap(role => state.squad
      .filter(player => player.role === role)
      .sort((a, b) => effective(b) - effective(a) || a.id - b.id)
      .slice(0, formations[state.formation][role]));
  }

  function strengths(state, starters, team) {
    const tactic = team.id === 0 ? state.tactic : team.tactic;
    const skill = team.id === 0 ? average(starters, effective) : team.skill;
    const rate = (skill - 52 - (2 - state.division) * 8) * .038;
    const formationAttack = team.id === 0 && state.formation === "4-3-3" ? .16 : 0;
    const formationDefense = team.id === 0 && state.formation === "5-3-2" ? .17 : 0;
    return { attack: rate + tactics[tactic].attack + formationAttack, defense: rate + tactics[tactic].defense + formationDefense, tactic };
  }

  function goalCount(rate, random) {
    const threshold = Math.exp(-clamp(rate, .22, 3.6));
    let count = 0;
    let sample = random();
    while (sample > threshold && count < 9) {
      count += 1;
      sample *= random();
    }
    return count;
  }

  function simulateMatch(state, starters, [home, away], random) {
    const h = strengths(state, starters, state.teams[home]);
    const a = strengths(state, starters, state.teams[away]);
    const edge = tactics[h.tactic].beats === a.tactic ? .23 : tactics[a.tactic].beats === h.tactic ? -.23 : 0;
    const goals = [
      goalCount(1.52 + h.attack - a.defense + edge, random),
      goalCount(1.27 + a.attack - h.defense - edge, random)
    ];
    const events = goals.flatMap((count, index) => Array.from({ length: count }, () => ({
      team: index === 0 ? home : away, minute: roll(random, 3, 90)
    }))).sort((x, y) => x.minute - y.minute);
    return { home, away, goals, events };
  }

  function record(state, id, scored, conceded) {
    const row = state.table[id];
    row.played += 1;
    row.gf += scored;
    row.ga += conceded;
    if (scored > conceded) { row.won += 1; row.points += 3; }
    else if (scored === conceded) { row.drawn += 1; row.points += 1; }
    else row.lost += 1;
  }

  function standings(state) {
    return [...state.table].sort((a, b) => b.points - a.points
      || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.id - b.id);
  }

  function finishRound(state, random = Math.random) {
    if (state.round >= state.fixtures.length) return false;
    const starters = lineup(state);
    const results = state.fixtures[state.round].map(pair => simulateMatch(state, starters, pair, random));
    let ownMatch;
    for (const m of results) {
      record(state, m.home, m.goals[0], m.goals[1]);
      record(state, m.away, m.goals[1], m.goals[0]);
      if (m.home === 0 || m.away === 0) ownMatch = m;
    }
    const goals = ownMatch.goals[ownMatch.home === 0 ? 0 : 1];
    const conceded = ownMatch.goals[ownMatch.home === 0 ? 1 : 0];
    const winBonus = goals > conceded ? 90 : goals === conceded ? 45 : 5;
    const revenue = (ownMatch.home === 0 ? 330 : 175) + winBonus + (2 - state.division) * 85;
    const wages = state.squad.reduce((total, player) => total + player.wage, 0);
    state.balance += revenue - wages;
    const startingIds = new Set(starters.map(p => p.id));
    for (const player of state.squad) {
      player.fatigue = clamp(player.fatigue + (startingIds.has(player.id) ? tactics[state.tactic].fatigue : -23), 0, 85);
      if (startingIds.has(player.id) && player.age <= 23 && random() < .15) {
        player.skill = Math.min(player.potential, player.skill + 1);
      }
    }
    state.results.push({ ...ownMatch, revenue, wages });
    state.round += 1;
    state.trained = false;
    if (state.round % 3 === 0) state.market = market(state, random);
    return true;
  }

  function train(state, type) {
    if (state.trained || state.round >= state.fixtures.length) return false;
    const focus = { attack: ["MF", "FW"], defense: ["GK", "DF"] };
    if (type === "recovery") {
      for (const player of state.squad) player.fatigue = Math.max(0, player.fatigue - 20);
    } else if (Object.hasOwn(focus, type) && state.balance >= 70) {
      for (const player of state.squad.filter(p => focus[type].includes(p.role))) {
        player.skill = Math.min(player.potential, player.skill + 1);
        player.fatigue = Math.min(85, player.fatigue + 4);
      }
      state.balance -= 70;
    } else return false;
    state.trained = true;
    return true;
  }

  function sign(state, id) {
    const player = state.market.find(target => target.id === id);
    if (!player || state.balance < player.cost || state.squad.length >= 24 || state.round >= state.fixtures.length) return false;
    state.balance -= player.cost;
    state.squad.push(player);
    state.market = state.market.filter(target => target.id !== id);
    return true;
  }

  function seasonResult(state) {
    if (state.round < state.fixtures.length) return null;
    const place = standings(state).findIndex(row => row.id === 0) + 1;
    const promotion = place <= 2 && state.division > 0;
    const relegation = place >= state.teams.length - 1 && state.division < divisions.length - 1;
    return { place, promotion, relegation, prize: (state.teams.length + 1 - place) * 140 + (promotion ? 1100 : 0) };
  }

  function nextSeason(state, random = Math.random) {
    const result = seasonResult(state);
    if (!result) return false;
    state.honors.push({ year: state.year, division: state.division, ...result });
    state.year += 1;
    if (result.promotion) state.division -= 1;
    if (result.relegation) state.division += 1;
    state.balance += result.prize;
    for (const player of state.squad) {
      player.age += 1;
      player.fatigue = 0;
      if (player.age < 25) player.skill = Math.min(player.skill + 2, player.potential);
      if (player.age > 32) player.skill = Math.max(30, player.skill - 2);
    }
    makeSeason(state, random);
    return true;
  }

  return { roles, tactics, formations, divisions, newClub, matchForClub, lineup, standings, finishRound, train, sign, seasonResult, nextSeason };
})();

if (typeof module !== "undefined" && module.exports) module.exports = ClubSim;
