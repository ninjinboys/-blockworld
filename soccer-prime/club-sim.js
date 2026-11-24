"use strict";

const ClubSim = (() => {
  const roles = ["GK", "DF", "MF", "FW"];
  const divisions = ["プロリーグ", "セミプロリーグ", "地域リーグ", "地域大会"];
  const clubLevels = ["プロクラブ", "セミプロクラブ", "地域リーグクラブ", "地域クラブ"];
  const tactics = {
    balanced: { name: "バランス", note: "中央を固めて隙を突く。カウンターに強い。", attack: 0, defense: 0, fatigue: 8, beats: "counter" },
    press: { name: "ハイプレス", note: "前線から奪いに行く。運動量が必要。", attack: .2, defense: -.06, fatigue: 13, beats: "balanced" },
    counter: { name: "カウンター", note: "引いて守り、相手の背後を突く。プレスに強い。", attack: -.06, defense: .14, fatigue: 6, beats: "press" }
  };
  const formations = {
    "4-4-2": { GK: 1, DF: 4, MF: 4, FW: 2 },
    "4-3-3": { GK: 1, DF: 4, MF: 3, FW: 3 },
    "5-3-2": { GK: 1, DF: 5, MF: 3, FW: 2 }
  };
  const rivals = [
    ["北海ノルド", "信州ハイランズ", "湾岸ユニオン", "相模ヴェルデ", "瀬戸内マリナーズ", "鳴門レグルス", "南九州ソル", "博多ヴェント", "越後ランス", "神戸ヴァレー", "横浜シーライツ", "仙台オリオン", "大阪イグニス", "都城ハヤテ", "浦和アステル", "千葉リベルタ", "札幌グレイス"],
    ["旭川ポラリス", "盛岡トレイル", "常陸ペンタス", "湘南ハーバー", "岐阜オークス", "紀州ファロス", "日向サンズ", "長崎ポルト", "富山レイル", "伊勢ブレイズ", "松本エッジ"],
    ["松江オルカ", "吉備フロンティア", "山口トライデント", "備後ユナイト", "三原イーグルス", "安芸フォレスト", "呉ブルーウェーブ", "鳥取エスパーダ", "防府ハイツ"],
    ["西風アスレティック", "尾道シーサイド", "東広島ノヴァ", "竹原ヴィスタ", "竹の子FC", "福山ロッソ", "安佐グリーンズ"]
  ];
  const lastNames = ["西原", "岩城", "川瀬", "藤野", "杉浦", "大森", "瀬戸", "谷口", "白石", "水谷", "青柳", "中尾", "堀江", "立花", "桐山", "宮本", "深町", "竹内", "小柳", "久米", "東雲", "松原", "五十嵐", "橋本", "川原", "寺田", "高井", "早坂", "安藤", "有村", "夏目", "弓削", "平戸", "井口", "林田", "百瀬", "寒川", "池永", "雨宮", "北川", "赤松", "佐々木", "西内", "児玉", "戸田", "相川", "石渡", "磯谷", "蛭田", "本橋", "南条", "沢木", "森崎", "広川", "山岸", "宇賀神"];
  const firstNames = ["悠真", "蓮", "快", "翼", "晴人", "航", "涼", "駿", "奏", "拓海", "玲", "新", "真尋", "葵", "一磨", "遥人", "陸斗", "海音", "大地", "航大", "匠", "柊", "青空", "颯", "佳祐", "将太", "透", "千隼", "正樹", "成吾", "慎吾", "司", "広夢", "輝", "紘平", "慧", "達哉", "凛太郎", "洸", "仁", "真", "岬", "慶", "蒼志", "柚希", "奏多", "優吾", "純平", "晴也", "悠生", "幹太", "朔", "光樹", "樹", "駿吾", "圭太"];
  const rosterRoles = ["GK", "GK", "DF", "DF", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "MF", "MF", "MF", "FW", "FW", "FW", "FW"];
  const stats = { shot: "決定力", pass: "パス", dribble: "ドリブル", defend: "守備", pace: "スピード", stamina: "スタミナ", save: "セービング" };
  const weights = {
    GK: { save: 5, defend: 2, pass: 1, stamina: 1 },
    DF: { defend: 5, pace: 2, pass: 2, stamina: 1 },
    MF: { pass: 4, dribble: 2, defend: 1, pace: 1, stamina: 2 },
    FW: { shot: 5, dribble: 2, pace: 2, stamina: 1 }
  };
  const drills = {
    shooting: { name: "フィニッシュ練習", keys: ["shot", "dribble"] },
    passing: { name: "パス練習", keys: ["pass", "dribble"] },
    defending: { name: "守備練習", keys: ["defend", "pace"] },
    keeping: { name: "GK練習", keys: ["save", "defend"] },
    running: { name: "フィジカル", keys: ["pace", "stamina"] },
    rest: { name: "休養", keys: [] }
  };
  const rarities = ["N", "R", "SR", "SSR", "UR", "LR", "MR"];
  const capacities = [800, 2500, 6000, 15000];
  const standsCosts = [1000, 2400, 4600];
  const facilities = {
    pitch: { name: "練習グラウンド", cost: 750, detail: "週間育成の効果を上げる。" },
    gym: { name: "フィジカルジム", cost: 1250, detail: "試合後の疲労を軽減する。" },
    lights: { name: "照明設備", cost: 1550, detail: "ホーム試合の観客が増える。" },
    academy: { name: "ユースアカデミー", cost: 2300, detail: "若手の育成とユース昇格の候補を強化する。", requires: "pitch" }
  };
  const colors = { "#e94141": "レッド", "#438aee": "ブルー", "#efba43": "イエロー", "#8bd74d": "グリーン", "#ae83ef": "パープル", "#ff954c": "オレンジ" };
  const limit = 32;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const roll = (random, low, high) => Math.floor(random() * (high - low + 1)) + low;
  const average = (items, value) => items.reduce((sum, item) => sum + value(item), 0) / Math.max(1, items.length);
  const pick = (random, choices) => choices[roll(random, 0, choices.length - 1)];
  const emptyStats = () => ({ games: 0, goals: 0, assists: 0, cleanSheets: 0 });
  const yearLabel = state => 2025 + state.year;

  function ability(player) {
    const role = weights[player.role];
    return Math.round(Object.entries(role).reduce((sum, [key, weight]) => sum + player.abilities[key] * weight, 0)
      / Object.values(role).reduce((sum, weight) => sum + weight, 0));
  }

  function attributes(role, skill, random) {
    return Object.fromEntries(Object.keys(stats).map(key => [
      key, clamp(skill + roll(random, -6, 6) - (weights[role][key] ? 0 : key === "save" ? 34 : 9), 15, 99)
    ]));
  }

  function normalizePlayer(player) {
    player.rar ??= player.skill >= 66 ? "SR" : player.skill >= 54 ? "R" : "N";
    player.abilities ??= Object.fromEntries(Object.keys(stats).map(key => [
      key, clamp(player.skill - (weights[player.role][key] ? 0 : key === "save" ? 34 : 9), 15, 99)
    ]));
    player.stats ??= emptyStats();
    player.career ??= { ...player.stats };
    player.condition ??= 3;
    player.growth ??= ["普通", "早熟", "晩成"][player.id % 3];
    player.potential = clamp(Math.max(player.skill, player.potential || player.skill + 8), 1, 99);
    player.number ??= player.id;
    return player;
  }

  function makePlayer(id, role, division, random, prospect = false) {
    const age = roll(random, 18, prospect ? 24 : 32);
    const skill = roll(random, 45, 58) + (3 - division) * 7 + (prospect ? 5 : 0);
    const name = prospect ? `${pick(random, lastNames)} ${pick(random, firstNames)}` : `${lastNames[id - 1]} ${firstNames[id % firstNames.length]}`;
    return normalizePlayer({
      id, role, name, age, skill, abilities: attributes(role, skill, random),
      potential: clamp(skill + roll(random, 5, age < 24 ? 24 : 14), skill, 99),
      fatigue: 0, cost: 180 + Math.max(0, skill - 42) * 25, wage: 5 + Math.round(skill / 8)
    });
  }

  function market(state, random) {
    return roles.map(role => makePlayer(state.nextId++, role, seasonDivision(state), random, true));
  }

  function seasonDivision(state) {
    return state.seasonDivision ?? state.division;
  }

  function makeSeason(state, random) {
    const tacticsKeys = Object.keys(tactics);
    state.seasonDivision = state.division;
    state.teams = [
      { id: 0, name: state.name },
      ...rivals[state.division].map((name, index) => ({
        id: index + 1, name, skill: 43 + (3 - state.division) * 9 + index * (state.division === 0 ? 1 : 2) + roll(random, 0, 4),
        tactic: pick(random, tacticsKeys)
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
    state.market = market(state, random);
    state.friendlies = [];
    state.lastWeek = null;
    state.promoted = false;
    state.offseasonDraft = null;
  }

  function validState(state) {
    return state && [1, 2].includes(state.version) && typeof state.name === "string"
      && Number.isFinite(state.balance) && Number.isInteger(state.year)
      && Number.isInteger(state.division) && divisions[state.division] !== undefined
      && Array.isArray(state.squad) && state.squad.length >= 11
      && state.squad.every(p => typeof p.name === "string" && roles.includes(p.role) && Number.isFinite(p.skill))
      && Array.isArray(state.teams) && Array.isArray(state.fixtures) && Array.isArray(state.results)
      && state.table?.length === state.teams.length && state.table.length >= 4
      && Number.isInteger(state.round) && state.round >= 0 && state.round <= state.fixtures.length
      && Object.hasOwn(formations, state.formation) && Object.hasOwn(tactics, state.tactic);
  }

  function hydrate(state) {
    const legacy = state.version === 1;
    state.version = 2;
    state.configured ??= legacy;
    state.color = Object.hasOwn(colors, state.color) ? state.color : "#8bd74d";
    state.seasonDivision ??= state.division;
    state.reserve ??= [];
    state.retired ??= [];
    state.market ??= [];
    state.honors ??= [];
    state.ledger ??= [];
    state.selection ??= {};
    state.training ??= {};
    state.trainingReport ??= [];
    state.friendlies ??= [];
    state.coins ??= 3500;
    state.pity ??= 0;
    state.daily ??= "";
    state.scouted ??= [];
    state.drafted ??= [];
    state.missions ??= [];
    state.coach ??= 1;
    state.drawn ??= 0;
    state.career ??= { games: state.round + state.honors.reduce((total, h) => total + (h.played || 14), 0), wins: state.table[0].won, goals: state.table[0].gf };
    state.venue ??= { stands: state.division < 2 ? 2 - state.division : state.division === 2 ? 1 : 0, facilities: {}, fans: state.division < 3 ? 1350 : 510, soldOuts: 0, attendance: 0, gate: 0, homeGames: 0 };
    for (const player of [...state.squad, ...state.reserve, ...state.market, ...state.retired]) normalizePlayer(player);
    if (legacy && state.trained) state.trainingReport = ["この節のチーム練習は旧バージョンで実施済みです。"];
    return state;
  }

  function newClub(random = Math.random) {
    const state = {
      version: 2, configured: false, name: "", year: 1, division: 3, balance: 6500,
      formation: "4-4-2", tactic: "balanced", nextId: rosterRoles.length + 1, honors: [],
      squad: rosterRoles.map((role, index) => makePlayer(index + 1, role, 3, random))
    };
    makeSeason(state, random);
    return hydrate(state);
  }

  function matchForClub(state, day = state.round) {
    const match = state.fixtures[day]?.find(pair => pair.includes(0));
    return match ? { home: match[0] === 0, opponent: state.teams[match.find(id => id !== 0)] } : null;
  }

  function weekDate(state) {
    const date = new Date(yearLabel(state), 2, 1);
    date.setDate(1 + (8 - date.getDay()) % 7 + state.round * 7);
    return date;
  }

  function friendlyOptions(state) {
    if (seasonOver(state)) return [];
    const league = matchForClub(state).opponent.id;
    return state.teams.filter(team => team.id && team.id !== league)
      .filter((_, index) => index === state.round % (state.teams.length - 2)
        || index === (state.round + 2) % (state.teams.length - 2))
      .map((opponent, index) => ({ opponent, day: index === 0 ? "火" : "木" }));
  }

  function effective(player) {
    return player.skill - player.fatigue * .25 + (player.condition - 3) * 2;
  }

  function lineupSlots(state) {
    return roles.flatMap(role => {
      const players = state.squad.filter(player => player.role === role)
        .sort((a, b) => effective(b) - effective(a) || a.id - b.id);
      const slots = Array.from({ length: formations[state.formation][role] }, (_, index) => role + (index + 1));
      const used = new Set();
      const selections = slots.map(slot => {
        const player = players.find(p => p.id === state.selection[slot] && !used.has(p.id));
        if (player) used.add(player.id);
        return player;
      });
      return slots.map((slot, index) => {
        const player = selections[index] || players.find(p => !used.has(p.id));
        if (player) used.add(player.id);
        return { slot, role, player };
      });
    });
  }

  function lineup(state) {
    return lineupSlots(state).map(slot => slot.player).filter(Boolean);
  }

  function setStarter(state, slot, id) {
    const slots = lineupSlots(state);
    const target = slots.find(candidate => candidate.slot === slot);
    const selected = state.squad.find(player => player.id === id && player.role === target?.role);
    if (!target || !selected) return false;
    const duplicate = slots.find(candidate => candidate.slot !== slot && candidate.player?.id === id);
    if (duplicate && target.player) state.selection[duplicate.slot] = target.player.id;
    state.selection[slot] = id;
    return true;
  }

  function teamPower(state) {
    return average(lineup(state), effective);
  }

  function rank(power) {
    return [[90, "SS"], [80, "S"], [70, "A"], [61, "B"], [51, "C"], [0, "D"]].find(([min]) => Math.max(0, power) >= min)[1];
  }

  function strengths(state, starters, team) {
    const tactic = team.id === 0 ? state.tactic : team.tactic;
    const skill = team.id === 0 ? average(starters, effective) : team.skill;
    const base = 51 + (3 - seasonDivision(state)) * 8;
    const rate = (skill - base) * .043;
    const local = team.id === 0;
    const attackShape = local && state.formation === "4-3-3" ? .2 : 0;
    const defenseShape = local && state.formation === "5-3-2" ? .21 : 0;
    const coach = local ? (state.coach - 1) * .025 : 0;
    return { attack: rate + tactics[tactic].attack + attackShape + coach, defense: rate + tactics[tactic].defense + defenseShape + coach, tactic };
  }

  function goalCount(rate, random) {
    const threshold = Math.exp(-clamp(rate, .2, 4.1));
    let count = 0;
    let sample = random();
    while (sample > threshold && count < 9) {
      count++;
      sample *= random();
    }
    return count;
  }

  function scorerFor(starters, random) {
    const byRole = { GK: 0, DF: 1, MF: 4, FW: 8 };
    const weighted = starters.flatMap(player => Array.from({ length: byRole[player.role] }, () => player));
    return pick(random, weighted);
  }

  function simulateMatch(state, starters, [home, away], random) {
    const h = strengths(state, starters, state.teams[home]);
    const a = strengths(state, starters, state.teams[away]);
    const edge = tactics[h.tactic].beats === a.tactic ? .26 : tactics[a.tactic].beats === h.tactic ? -.26 : 0;
    const goals = [goalCount(1.46 + h.attack - a.defense + edge, random), goalCount(1.19 + a.attack - h.defense - edge, random)];
    const events = goals.flatMap((count, index) => Array.from({ length: count }, () => {
      const team = index === 0 ? home : away;
      const scorer = team === 0 ? scorerFor(starters, random) : null;
      const assistPool = starters.filter(p => p.role !== "GK" && p.id !== scorer?.id);
      const assist = scorer && random() < .74 ? pick(random, assistPool) : null;
      return { team, minute: roll(random, 3, 90), scorer: scorer?.id, name: scorer?.name, assist: assist?.id, assistName: assist?.name };
    })).sort((x, y) => x.minute - y.minute);
    return { home, away, goals, events };
  }

  function record(state, id, scored, conceded) {
    const row = state.table[id];
    row.played++;
    row.gf += scored;
    row.ga += conceded;
    if (scored > conceded) { row.won++; row.points += 3; }
    else if (scored === conceded) { row.drawn++; row.points++; }
    else row.lost++;
  }

  function standings(state) {
    return [...state.table].sort((a, b) => b.points - a.points
      || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.id - b.id);
  }

  function addPlayerStat(player, key) {
    player.stats[key]++;
    player.career[key]++;
  }

  function applyTraining(state, random) {
    const boost = state.venue.facilities.pitch ? .16 : 0;
    const academy = state.venue.facilities.academy ? .12 : 0;
    state.trainingReport = [];
    for (const player of state.squad) {
      const key = state.training[player.id] || "rest";
      const drill = drills[key] || drills.rest;
      if (drill === drills.rest) {
        player.fatigue = Math.max(0, player.fatigue - 15);
        continue;
      }
      const peakAge = { 早熟: 23, 普通: 27, 晩成: 30 }[player.growth] || 27;
      const chance = .44 + boost + (state.coach - 1) * .07 + (player.age <= peakAge ? .13 + academy : -.1)
        - player.fatigue * .004;
      const lucky = random();
      const gain = lucky < chance * .06 ? 4 : lucky < chance * .25 ? 2 : lucky < chance ? 1 : 0;
      const changes = [];
      for (const stat of drill.keys) {
        const before = player.abilities[stat];
        if (gain && before < player.potential) player.abilities[stat] = Math.min(player.potential, before + gain);
        const diff = player.abilities[stat] - before;
        if (diff) changes.push(`${stats[stat]} +${diff}`);
      }
      player.fatigue = clamp(player.fatigue + (state.venue.facilities.gym ? 4 : 7), 0, 88);
      player.skill = ability(player);
      state.trainingReport.push(`${player.name} · ${changes.length ? changes.join("、") : "能力の変化なし"}${gain === 4 && changes.length ? "（特大アップ）" : ""}`);
    }
  }

  function setTraining(state, id, drill) {
    if (!Object.hasOwn(drills, drill) || !state.squad.some(player => player.id === id) || seasonOver(state)) return false;
    state.training[id] = drill;
    return true;
  }

  function venueForMatch(state, won, home, random) {
    const venue = state.venue;
    const fans = Math.max(20, 40 + (won ? 82 : 30) + (seasonDivision(state) < 3 ? 28 : 0));
    venue.fans = Math.min(26000, venue.fans + fans);
    if (!home) return { attendance: 0, gate: 0 };
    const capacity = capacities[venue.stands];
    const attendance = clamp(Math.round((venue.fans + roll(random, -55, 40)) * (venue.facilities.lights ? 1.14 : 1)), 1, capacity);
    const gate = Math.round(attendance * .34);
    venue.soldOuts += Number(attendance === capacity);
    venue.homeGames++;
    venue.attendance += attendance;
    venue.gate += gate;
    return { attendance, capacity, gate };
  }

  function finishRound(state, random = Math.random) {
    if (seasonOver(state)) return false;
    const exhibition = friendlyOptions(state).filter(({ opponent }) => state.friendlies.includes(opponent.id));
    if (!state.trained) applyTraining(state, random);
    state.trained = false;
    const starters = lineup(state);
    const exhibitionMatches = exhibition.map(({ opponent }) => {
      const match = simulateMatch(state, starters, [0, opponent.id], random);
      const reward = match.goals[0] >= match.goals[1] ? 100 : 60;
      state.coins += reward;
      return { ...match, coins: reward };
    });
    const results = state.fixtures[state.round].map(pair => simulateMatch(state, starters, pair, random));
    let ownMatch;
    for (const match of results) {
      record(state, match.home, match.goals[0], match.goals[1]);
      record(state, match.away, match.goals[1], match.goals[0]);
      if (match.home === 0 || match.away === 0) ownMatch = match;
    }
    const home = ownMatch.home === 0;
    const scored = ownMatch.goals[home ? 0 : 1];
    const conceded = ownMatch.goals[home ? 1 : 0];
    const won = scored > conceded;
    const ticket = venueForMatch(state, won, home, random);
    const sponsor = 170 + (3 - seasonDivision(state)) * 92 + (won ? 130 : scored === conceded ? 65 : 30);
    const revenue = ticket.gate + sponsor;
    const wages = state.squad.reduce((total, player) => total + player.wage, 0);
    state.balance += revenue - wages;
    state.coins += won ? 260 : scored === conceded ? 180 : 130;
    state.career.games++;
    state.career.wins += Number(won);
    state.career.goals += scored;
    const byId = new Map(starters.map(p => [p.id, p]));
    for (const player of state.squad) {
      if (byId.has(player.id)) {
        const fatigue = tactics[state.tactic].fatigue + exhibition.length * 5 - (state.venue.facilities.gym ? 4 : 0);
        player.fatigue = clamp(player.fatigue + fatigue, 0, 90);
        addPlayerStat(player, "games");
        if (player.role === "GK" && !conceded) addPlayerStat(player, "cleanSheets");
      } else player.fatigue = Math.max(0, player.fatigue - 14);
      player.condition = clamp(player.condition + roll(random, -1, 1) + (won && random() < .25 ? 1 : 0), 1, 5);
    }
    for (const event of ownMatch.events) {
      if (byId.has(event.scorer)) addPlayerStat(byId.get(event.scorer), "goals");
      if (byId.has(event.assist)) addPlayerStat(byId.get(event.assist), "assists");
    }
    const matchRecord = { ...ownMatch, ...ticket, revenue, wages };
    state.results.push(matchRecord);
    state.lastWeek = { league: matchRecord, friendlies: exhibitionMatches };
    state.friendlies = [];
    state.round++;
    if (state.round % 3 === 0) state.market = market(state, random);
    return true;
  }

  function addLedger(state, name, amount) {
    state.ledger.unshift({ year: state.year, round: state.round, name, amount });
    state.ledger = state.ledger.slice(0, 30);
  }

  function facilityStatus(state, key) {
    if (key === "stands") return state.venue.stands >= standsCosts.length ? "拡張済み" : "";
    if (!Object.hasOwn(facilities, key)) return "対象外";
    if (state.venue.facilities[key]) return "建設済み";
    const need = facilities[key].requires;
    return need && !state.venue.facilities[need] ? `${facilities[need].name}の建設後に解放` : "";
  }

  function facilityPrice(state, key) {
    return key === "stands" ? standsCosts[state.venue.stands] : facilities[key]?.cost;
  }

  function venueWithUpgrade(venue, key) {
    if (key === "stands") return { ...venue, stands: Math.min(venue.stands + 1, capacities.length - 1) };
    if (Object.hasOwn(facilities, key)) return { ...venue, facilities: { ...venue.facilities, [key]: true } };
    return venue;
  }

  function buyFacility(state, key) {
    const price = facilityPrice(state, key);
    if (!price || state.balance < price || facilityStatus(state, key)) return false;
    state.balance -= price;
    state.venue = venueWithUpgrade(state.venue, key);
    addLedger(state, key === "stands" ? "スタンド拡張" : facilities[key].name, -price);
    return true;
  }

  function promotePlayer(state, id) {
    const index = state.reserve.findIndex(p => p.id === id);
    if (index < 0 || state.squad.length >= limit) return false;
    state.squad.push(...state.reserve.splice(index, 1));
    return true;
  }

  function sendToReserve(state, id) {
    const index = state.squad.findIndex(p => p.id === id);
    if (index < 0) return false;
    const role = state.squad[index].role;
    if (state.squad.filter(p => p.role === role).length <= Math.max(...Object.values(formations).map(f => f[role]))) return false;
    state.reserve.push(...state.squad.splice(index, 1));
    for (const [slot, playerId] of Object.entries(state.selection)) if (playerId === id) delete state.selection[slot];
    return true;
  }

  function sign(state, id) {
    const player = state.market.find(target => target.id === id);
    if (!player || state.balance < player.cost) return false;
    state.balance -= player.cost;
    (state.squad.length < limit ? state.squad : state.reserve).push(player);
    state.market = state.market.filter(target => target.id !== id);
    addLedger(state, player.name + " 獲得", -player.cost);
    return true;
  }

  function seasonOver(state) {
    return state.round >= state.fixtures.length;
  }

  function seasonResult(state) {
    if (!seasonOver(state)) return null;
    const table = standings(state);
    const place = table.findIndex(row => row.id === 0) + 1;
    const best = [...state.squad, ...state.reserve].sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists)[0];
    return {
      place, winner: state.teams[table[0].id].name,
      prize: (state.teams.length + 1 - place) * 175,
      played: state.round, won: state.table[0].won, drawn: state.table[0].drawn, lost: state.table[0].lost,
      topScorer: best?.stats.goals ? `${best.name}（${best.stats.goals}得点）` : "—"
    };
  }

  function promotionConditions(state) {
    const venue = state.venue;
    const level = seasonDivision(state);
    const result = seasonResult(state);
    if (level === 3) return [
      [venue.soldOuts >= 2, `ホーム満員 ${Math.min(venue.soldOuts, 2)} / 2回`],
      [venue.facilities.pitch, "練習グラウンドを建設"]
    ];
    if (level === 2) return [[venue.stands >= 1, "スタジアムを2,500席に拡張"], [result?.place <= 3, "地域リーグで3位以内"]];
    if (level === 1) {
      const prior = state.honors.at(-1);
      return [[venue.stands >= 2, "スタジアムを6,000席に拡張"],
        [result?.place === 1 || (result?.place <= 3 && prior?.division === 1 && prior.place <= 3), "リーグ優勝、または2年連続で3位以内"]];
    }
    return [];
  }

  function promoteClub(state) {
    const conditions = promotionConditions(state);
    if (!seasonOver(state) || state.promoted || !conditions.length || !conditions.every(([met]) => met)) return false;
    state.division--;
    state.promoted = true;
    return true;
  }

  function openDraft(state, random = Math.random) {
    if (!seasonOver(state)) return null;
    if (!state.offseasonDraft) {
      state.offseasonDraft = {
        signed: false,
        candidates: roles.map(role => {
          const candidate = makePlayer(state.nextId++, role, state.division, random, true);
          candidate.age = roll(random, 16, 19);
          candidate.potential = clamp(candidate.potential + (state.venue.facilities.academy ? 11 : 5), 1, 99);
          return candidate;
        })
      };
    }
    return state.offseasonDraft;
  }

  function signYouth(state, id, name, stat) {
    const camp = state.offseasonDraft;
    const player = camp?.candidates.find(p => p.id === id);
    if (!seasonOver(state) || !player || camp.signed || !Object.hasOwn(stats, stat)) return false;
    if (name.trim()) player.name = name.trim().slice(0, 24);
    player.abilities[stat] = Math.min(player.potential, player.abilities[stat] + 6);
    player.skill = ability(player);
    player.youth = true;
    camp.signed = true;
    state.drafted.push({ ...player, abilities: { ...player.abilities } });
    (state.squad.length < limit ? state.squad : state.reserve).push(player);
    return true;
  }

  function agePlayer(player) {
    player.age++;
    player.fatigue = 0;
    player.condition = 3;
    player.stats = emptyStats();
    const change = player.age <= 22 ? 1 : player.age > 33 ? -2 : 0;
    for (const stat of Object.keys(stats)) {
      const current = player.abilities[stat];
      player.abilities[stat] = clamp(current + change, 15, Math.max(player.potential, current));
    }
    player.skill = ability(player);
  }

  function nextSeason(state, random = Math.random) {
    const result = seasonResult(state);
    if (!result) return false;
    state.honors.push({ year: state.year, division: seasonDivision(state), promoted: !!state.promoted, ...result });
    state.year++;
    state.balance += result.prize;
    state.coins += 1250;
    for (const player of [...state.squad, ...state.reserve]) agePlayer(player);
    const retiring = [...state.squad, ...state.reserve].filter(player => player.age >= 38);
    for (const player of retiring) {
      if (state.squad.includes(player) && !sendToReserve(state, player.id)) {
        const replacement = makePlayer(state.nextId++, player.role, state.division, random, true);
        state.squad.push(replacement);
        sendToReserve(state, player.id);
      }
      state.reserve = state.reserve.filter(p => p.id !== player.id);
      state.retired.unshift({ ...player, retiredYear: state.year - 1 });
    }
    makeSeason(state, random);
    return true;
  }

  return {
    roles, divisions, clubLevels, tactics, formations, stats, drills, rarities, capacities, facilities, colors, lastNames, firstNames, limit,
    clamp, roll, pick, ability, attributes, normalizePlayer, emptyStats, newClub, hydrate, validState, yearLabel, weekDate,
    matchForClub, friendlyOptions, lineup, lineupSlots, setStarter, effective, teamPower, rank, standings, finishRound, setTraining,
    seasonDivision, seasonOver, seasonResult, nextSeason, sign, facilityStatus, facilityPrice, venueWithUpgrade, buyFacility, promotionConditions, promoteClub,
    addLedger, promotePlayer, sendToReserve, openDraft, signYouth, goalCount
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = ClubSim;
