"use strict";

const ClubScout = (() => {
  const sim = typeof ClubSim === "undefined" ? require("./club-sim.js") : ClubSim;
  const rates = [["N", 3089], ["R", 4000], ["SR", 2200], ["SSR", 700], ["UR", 10], ["LR", 1]];
  const base = { N: 44, R: 51, SR: 60, SSR: 68, UR: 76, LR: 84, MR: 89 };
  const rarRank = rarity => sim.rarities.indexOf(rarity);

  function seeded(seed) {
    return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  }

  function catalogPlayer(index, name, role, rar, random) {
    const skill = base[rar] + sim.roll(random, -3, 3);
    return {
      catalog: index, name, role, rar, skill,
      age: sim.roll(random, 18, 29),
      growth: sim.pick(random, ["早熟", "普通", "晩成"]),
      potential: Math.min(99, skill + sim.roll(random, 9, 18)),
      abilities: sim.attributes(role, skill, random)
    };
  }

  const catalog = Array.from({ length: 3012 }, (_, index) => {
    const random = seeded((index + 51) * 8281);
    const id = (index * 997) % (sim.lastNames.length * sim.firstNames.length);
    const rarityRoll = sim.roll(random, 0, 999);
    const rar = rarityRoll < 345 ? "N" : rarityRoll < 662 ? "R" : rarityRoll < 849 ? "SR"
      : rarityRoll < 943 ? "SSR" : rarityRoll < 981 ? "UR" : "LR";
    const name = sim.lastNames[Math.floor(id / sim.firstNames.length)] + " " + sim.firstNames[id % sim.firstNames.length];
    const role = sim.pick(random, ["GK", "DF", "DF", "MF", "MF", "FW", "FW"]);
    return catalogPlayer(index + 1, name, role, rar, random);
  });

  const missions = [
    ["藤代 天馬", "FW", "公式戦で5勝", s => [s.career.wins, 5]],
    ["高嶺 蒼太", "MF", "公式戦で20得点", s => [s.career.goals, 20]],
    ["城間 凪", "GK", "シーズン中に5回の無失点", s => [Math.max(0, ...s.squad.map(p => p.stats.cleanSheets)), 5]],
    ["武居 大河", "DF", "ホームを3回満員にする", s => [s.venue.soldOuts, 3]],
    ["九条 凛", "MF", "地域リーグに昇格", s => [3 - s.division, 1]],
    ["緒方 南雲", "FW", "公式戦で50得点", s => [s.career.goals, 50]],
    ["北条 渉", "DF", "スタジアムを6,000席に拡張", s => [s.venue.stands, 2]],
    ["日向 晃", "GK", "練習施設を3つ建設", s => [Object.keys(s.venue.facilities).length, 3]],
    ["天野 星弥", "FW", "スカウトで100人獲得", s => [s.drawn, 100]],
    ["鷹尾 結人", "MF", "セミプロリーグに昇格", s => [3 - s.division, 2]],
    ["砂原 一成", "DF", "ユース選手を2人昇格", s => [s.drafted.length, 2]],
    ["西園寺 統", "GK", "5シーズン完走", s => [s.honors.length, 5]],
    ["橘 栄士", "MF", "クラブ戦力B以上", s => [Math.floor(sim.teamPower(s)), 61]],
    ["朝霧 ヨハン", "FW", "プロリーグに昇格", s => [3 - s.division, 3]],
    ["御門 龍生", "DF", "プロリーグ優勝", s => [s.honors.filter(h => h.division === 0 && h.place === 1).length + Number(sim.seasonDivision(s) === 0 && sim.seasonResult(s)?.place === 1), 1]]
  ].map(([name, role, label, progress], index) => ({
    label, progress, player: catalogPlayer(5001 + index, name, role, "MR", seeded(index + 10422))
  }));

  function dailyKey(date = new Date()) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-");
  }

  function recruit(state, original, direct = true) {
    const player = sim.normalizePlayer({
      ...original, abilities: { ...original.abilities }, id: state.nextId++, fatigue: 0,
      cost: (original.skill - 36) * 34, wage: 5 + Math.round(original.skill / 7)
    });
    if (direct && state.squad.length < sim.limit) state.squad.push(player);
    else state.reserve.push(player);
    state.scouted.push(original.catalog);
    return player;
  }

  function rarityAt(random) {
    let entry = Math.floor(random() * 10000);
    return rates.find(([, weight]) => (entry -= weight) < 0)?.[0] ?? "N";
  }

  function takeCandidate(pool, minimum, wanted, random) {
    const exact = pool.filter(p => p.rar === wanted);
    if (exact.length) return sim.pick(random, exact);
    const higher = pool.filter(p => rarRank(p.rar) >= rarRank(minimum));
    return higher.length ? sim.pick(random, higher) : sim.pick(random, pool);
  }

  function draw(state, count, mode, random = Math.random, date = new Date()) {
    if (![1, 10].includes(count) || !["normal", "featured", "attack", "defense", "free"].includes(mode)) return null;
    const free = mode === "free";
    const price = free ? 0 : count === 10 ? 2700 : 300;
    const day = dailyKey(date);
    if (state.coins < price || (free && (state.daily === day || count !== 1))) return null;
    const owned = new Set(state.scouted);
    const pool = catalog.filter(player => !owned.has(player.catalog)
      && (mode !== "attack" || ["MF", "FW"].includes(player.role))
      && (mode !== "defense" || ["GK", "DF"].includes(player.role)));
    if (pool.length < count) return null;
    const results = [];
    for (let i = 0; i < count; i++) {
      state.pity++;
      const minimum = state.pity >= 100 ? "UR" : count === 10 && i === 9 ? "SR" : "N";
      let rarity = rarityAt(random);
      if (mode === "featured" && rarRank(rarity) < 2 && random() < .15) rarity = "SR";
      if (rarRank(rarity) < rarRank(minimum)) rarity = minimum;
      const found = takeCandidate(pool, minimum, rarity, random);
      if (rarRank(found.rar) >= rarRank("UR")) state.pity = 0;
      pool.splice(pool.indexOf(found), 1);
      results.push(recruit(state, found, false));
    }
    state.coins -= price;
    state.drawn += count;
    if (free) state.daily = day;
    return results;
  }

  function offer(state, kind, random = Math.random) {
    const costs = { foreign: 2500, freeAgent: 4500, trade: 0 };
    if (!Object.hasOwn(costs, kind) || state.balance < costs[kind]) return null;
    const owned = new Set(state.scouted);
    const outgoing = kind === "trade" ? state.reserve.find(p => rarRank(p.rar) <= 2) : null;
    if (kind === "trade" && !outgoing) return null;
    const eligible = catalog.filter(p => !owned.has(p.catalog)
      && (kind === "trade" ? p.rar === "SR" && p.role === outgoing.role : p.rar === (kind === "foreign" ? "SR" : "SSR")));
    if (!eligible.length) return null;
    const candidate = sim.pick(random, eligible);
    if (outgoing) state.reserve = state.reserve.filter(p => p.id !== outgoing.id);
    const player = recruit(state, candidate);
    if (kind === "foreign") {
      const first = sim.pick(random, ["アレックス", "マルコ", "ノア", "ルイス", "テオ", "ディエゴ"]);
      const last = sim.pick(random, ["ヴェガ", "モレノ", "サントス", "ホルム", "ノヴァク", "バレンテ"]);
      player.name = first + " " + last;
    }
    state.balance -= costs[kind];
    sim.addLedger(state, player.name + (outgoing ? " トレード加入" : " 獲得"), -costs[kind]);
    return player;
  }

  function claim(state, index) {
    const mission = missions[index];
    if (!mission || state.missions.includes(index)) return null;
    const [current, goal] = mission.progress(state);
    if (current < goal) return null;
    state.missions.push(index);
    return recruit(state, mission.player, false);
  }

  function snapshot(state) {
    return {
      v: 1, name: state.name || "SOCCER PRIME", formation: state.formation,
      tactic: state.tactic, power: Math.round(sim.teamPower(state)),
      roster: sim.lineup(state).map(p => ({ name: p.name, role: p.role, skill: p.skill }))
    };
  }

  function teamCode(state) {
    const data = new TextEncoder().encode(JSON.stringify(snapshot(state)));
    return "SP1-" + btoa(String.fromCharCode(...data)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  }

  function parseCode(code) {
    if (!/^SP1-[\w-]{20,6000}$/.test(code)) return null;
    try {
      const packed = code.slice(4).replaceAll("-", "+").replaceAll("_", "/");
      const decoded = new TextDecoder().decode(Uint8Array.from(atob(packed), char => char.charCodeAt(0)));
      const data = JSON.parse(decoded);
      if (data.v !== 1 || typeof data.name !== "string" || data.name.length > 24
        || !Object.hasOwn(sim.tactics, data.tactic) || !Object.hasOwn(sim.formations, data.formation)
        || !Number.isFinite(data.power) || data.power < 1 || data.power > 100
        || !Array.isArray(data.roster) || data.roster.length !== 11
        || data.roster.some(p => typeof p.name !== "string" || p.name.length > 32 || !sim.roles.includes(p.role)
          || !Number.isFinite(p.skill) || p.skill < 1 || p.skill > 99)
        || sim.roles.some(role => data.roster.filter(p => p.role === role).length !== sim.formations[data.formation][role])) return null;
      return data;
    } catch {
      return null;
    }
  }

  function friendlyBattle(state, away, random = Math.random) {
    const home = snapshot(state);
    const edge = sim.tactics[home.tactic].beats === away.tactic ? .23 : sim.tactics[away.tactic].beats === home.tactic ? -.23 : 0;
    const advantage = (home.power - away.power) * .045 + edge;
    const scores = [sim.goalCount(1.48 + advantage, random), sim.goalCount(1.27 - advantage, random)];
    const events = scores.flatMap((count, index) => Array.from({ length: count }, () => ({
      team: index, minute: sim.roll(random, 4, 90),
      name: sim.pick(random, (index === 0 ? home : away).roster.filter(p => ["MF", "FW"].includes(p.role))).name
    }))).sort((a, b) => a.minute - b.minute);
    return { home, away, goals: scores, events };
  }

  return { catalog, missions, rates, dailyKey, draw, offer, claim, teamCode, parseCode, friendlyBattle };
})();

if (typeof module !== "undefined" && module.exports) module.exports = ClubScout;
