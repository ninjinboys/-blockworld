"use strict";

const saveKey = "soccer-prime.club.v1";
const row = (id) => document.getElementById(id);
const listen = (id, event, handler) => row(id).addEventListener(event, handler);
const panel = row("club-view");
const nameDialog = row("name-dialog");
const yen = new Intl.NumberFormat("ja-JP");
const money = (value) => `${yen.format(value)} 万円`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const disabled = (condition) => condition ? " disabled" : "";
let state = loadClub();
let activeView = "matchday";
let noticeTimer;
let canSave = true;

function loadClub() {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey));
    if (saved?.version === 1 && Array.isArray(saved.squad) && Array.isArray(saved.fixtures)) return saved;
  } catch {
    // The default club is playable even without local storage.
  }
  return ClubSim.newClub();
}

function saveClub() {
  try {
    localStorage.setItem(saveKey, JSON.stringify(state));
  } catch {
    canSave = false;
  }
}

function announce(message) {
  const el = row("club-notice");
  clearTimeout(noticeTimer);
  el.textContent = message + (canSave ? "" : " このブラウザでは進行を保存できません。");
  el.hidden = false;
  noticeTimer = setTimeout(() => { el.hidden = true; }, 4300);
}

function options(choices, current, label) {
  return Object.entries(choices).map(([key, item]) =>
    `<option value="${key}" ${key === current ? "selected" : ""}>${label(item, key)}</option>`).join("");
}

function matchday() {
  const result = ClubSim.seasonResult(state);
  if (result) {
    const outcome = result.promotion ? "昇格決定" : result.relegation ? "降格" : result.place === 1 ? "リーグ優勝" : "シーズン終了";
    return `<h2 id="view-title">シーズン結果</h2>
      <div class="season-result"><strong>${outcome}・${result.place}位</strong><p>賞金 ${money(result.prize)}</p></div>
      <button type="button" class="action" data-play>次のシーズンへ</button>`;
  }
  const match = ClubSim.matchForClub(state);
  const lastRound = state.fixtures.length;
  const upcoming = state.fixtures.slice(state.round + 1, state.round + 4).map((_, index) => {
    const day = state.round + index + 1;
    const fixture = ClubSim.matchForClub(state, day);
    return `<li><span><small>第${day + 1}節</small>　${escapeHtml(fixture.opponent.name)}</span><small>${fixture.home ? "ホーム" : "アウェー"}</small></li>`;
  }).join("");
  return `<h2 id="view-title">次の試合</h2>
    <div class="next-fixture">
      <div><small>第${state.round + 1}節 / 全${lastRound}節</small><strong>${escapeHtml(match.opponent.name)}</strong></div>
      <span class="venue-label">${match.home ? "HOME" : "AWAY"}</span>
    </div>
    <div class="prep-controls">
      <label>フォーメーション<select data-setting="formation">${options(ClubSim.formations, state.formation, (_, key) => key)}</select></label>
      <label>戦術<select data-setting="tactic">${options(ClubSim.tactics, state.tactic, item => item.name)}</select></label>
    </div>
    <p class="panel-hint">${ClubSim.tactics[state.tactic].note} 相手の戦術は${ClubSim.tactics[match.opponent.tactic].name}。</p>
    <button type="button" class="action" data-play>試合を進める</button>
    ${upcoming ? `<ul class="fixture-list" aria-label="今後の日程">${upcoming}</ul>` : ""}`;
}

function squad() {
  const starters = new Set(ClubSim.lineup(state).map(player => player.id));
  const closed = state.round >= state.fixtures.length;
  const blocked = state.trained || closed;
  const free = state.balance >= 70;
  return `<h2 id="view-title">編成・練習</h2>
    <p class="panel-hint">${closed ? "シーズン終了" : state.trained ? "今節の練習は完了しました。" : "各節で1回練習できます。先発は能力と疲労から決まります。"}</p>
    <div class="training-actions">
      <button class="small-button" type="button" data-train="attack"${disabled(blocked || !free)}>攻撃練習 · 70万円</button>
      <button class="small-button" type="button" data-train="defense"${disabled(blocked || !free)}>守備練習 · 70万円</button>
      <button class="small-button" type="button" data-train="recovery"${disabled(blocked)}>疲労回復</button>
    </div>
    <div class="club-table-wrap"><table class="club-table">
      <thead><tr><th scope="col">位置</th><th scope="col" class="text-left">選手</th><th scope="col">年齢</th><th scope="col">能力</th><th scope="col">疲労</th><th scope="col">起用</th></tr></thead>
      <tbody>${state.squad.map(player => `<tr><td>${player.role}</td><td class="text-left">${escapeHtml(player.name)}</td><td>${player.age}</td><td>${player.skill}</td><td>${player.fatigue}</td><td class="${starters.has(player.id) ? "starter" : ""}">${starters.has(player.id) ? "先発" : "控え"}</td></tr>`).join("")}</tbody>
    </table></div>`;
}

function market() {
  const closed = state.round >= state.fixtures.length;
  const full = state.squad.length >= 24;
  const shortage = state.market.length === 0;
  const message = closed ? "次のシーズンから選手を獲得できます。" : full ? "選手登録数が上限の24人に達しました。" :
    "補強候補は3節ごとに入れ替わります。獲得費はクラブ資金から支払います。";
  return `<h2 id="view-title">選手補強</h2>
    <p class="panel-hint">${message}</p>
    ${shortage ? '<p class="empty">今の候補選手は全員獲得済みです。</p>' : `
    <div class="market-grid">${state.market.map(player => `<article class="market-player">
      <strong>${escapeHtml(player.name)}</strong><span>${player.role} · ${player.age}歳</span>
      <span>能力 ${player.skill} ／ 成長上限 ${player.potential}</span><span>週給 ${money(player.wage)}</span>
      <button class="small-button sign-button" type="button" data-sign="${player.id}" aria-label="${escapeHtml(player.name)}を${money(player.cost)}で獲得"${disabled(closed || full || state.balance < player.cost)}>獲得 · ${money(player.cost)}</button>
    </article>`).join("")}</div>`}`;
}

function standings() {
  const promotion = state.division > 0 ? "上位2クラブが昇格。" : "1位のクラブが優勝。";
  const relegation = state.division < ClubSim.divisions.length - 1 ? " 下位2クラブが降格。" : "";
  return `<h2 id="view-title">リーグ順位表</h2>
    <p class="panel-hint">${promotion}${relegation} 同勝点の場合は得失点差、総得点の順。</p>
    <div class="club-table-wrap"><table class="club-table">
      <thead><tr><th scope="col">順位</th><th scope="col" class="text-left">クラブ</th><th scope="col">試</th><th scope="col">勝</th><th scope="col">分</th><th scope="col">負</th><th scope="col">差</th><th scope="col">点</th></tr></thead>
      <tbody>${ClubSim.standings(state).map((stats, index) => `<tr class="${stats.id === 0 ? "own-row" : ""}">
        <td>${index + 1}</td><td class="text-left">${escapeHtml(state.teams[stats.id].name)}</td><td>${stats.played}</td>
        <td>${stats.won}</td><td>${stats.drawn}</td><td>${stats.lost}</td><td>${stats.gf - stats.ga}</td><td>${stats.points}</td>
      </tr>`).join("")}</tbody>
    </table></div>
    ${state.honors.length ? `<ul class="fixture-list" aria-label="過去シーズン">${state.honors.slice(-3).reverse().map(season =>
      `<li><span>${season.year}年目 · ${ClubSim.divisions[season.division]}</span><strong>${season.place}位${season.promotion ? " · 昇格" : season.relegation ? " · 降格" : ""}</strong></li>`).join("")}</ul>` : ""}`;
}

function renderSidebar() {
  const last = state.results.at(-1);
  const teamName = (id) => escapeHtml(state.teams[id].name);
  const net = last ? last.revenue - last.wages : 0;
  row("last-result").innerHTML = `<h2 id="result-title">${last ? `第${state.round}節の結果` : "試合結果"}</h2>
    ${last ? `<div class="result-score"><span class="${last.home === 0 ? "club-result" : ""}">${teamName(last.home)}</span><strong>${last.goals.join(" – ")}</strong><span class="${last.away === 0 ? "club-result" : ""}">${teamName(last.away)}</span></div>
    ${last.events.length ? `<ul class="goal-events" aria-label="得点経過">${last.events.map(event => `<li><strong>${event.minute}分</strong><span>${teamName(event.team)} ゴール</span></li>`).join("")}</ul>` : '<p class="empty">両チーム無得点で終了。</p>'}` : '<p class="empty">試合を進めると、スコアと得点経過が表示されます。</p>'}`;
  row("finance").innerHTML = `<h2 id="finance-title">クラブ会計</h2>
    <dl class="finances">
      <div><dt>選手の合計週給</dt><dd>${money(state.squad.reduce((sum, player) => sum + player.wage, 0))}</dd></div>
      <div><dt>前節の試合収入</dt><dd>${last ? money(last.revenue) : "—"}</dd></div>
      <div><dt>前節の収支</dt><dd class="${net < 0 ? "negative" : "positive"}">${last ? money(net) : "—"}</dd></div>
    </dl>`;
}

function render() {
  row("season-division").textContent = `${state.year}年目 · ${ClubSim.divisions[state.division]}`;
  row("club-name").textContent = state.name;
  row("club-position").textContent = state.round ? `${ClubSim.standings(state).findIndex(stats => stats.id === 0) + 1} 位` : "—";
  row("club-points").textContent = `${state.table[0].points} 点`;
  row("club-money").textContent = money(state.balance);
  const views = { matchday, squad, market, standings };
  panel.innerHTML = views[activeView]();
  renderSidebar();
}

for (const button of document.querySelectorAll("[data-view]")) {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    for (const tab of document.querySelectorAll("[data-view]")) {
      tab.setAttribute("aria-pressed", String(tab === button));
    }
    render();
  });
}

panel.addEventListener("change", event => {
  const setting = event.target.dataset.setting;
  const choices = { formation: ClubSim.formations, tactic: ClubSim.tactics };
  if (!Object.hasOwn(choices, setting) || !Object.hasOwn(choices[setting], event.target.value)) return;
  state[setting] = event.target.value;
  saveClub();
  render();
  panel.querySelector(`[data-setting="${setting}"]`)?.focus();
});

panel.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  let message;
  if (button.hasAttribute("data-play")) {
    const season = ClubSim.seasonResult(state);
    if (season) {
      ClubSim.nextSeason(state);
      message = `${state.year}年目のシーズンを開始しました。`;
    } else if (ClubSim.finishRound(state)) {
      const match = state.results.at(-1);
      message = `第${state.round}節 ${state.teams[match.home].name} ${match.goals.join(" – ")} ${state.teams[match.away].name}`;
    }
  } else if (button.dataset.train && ClubSim.train(state, button.dataset.train)) {
    message = button.dataset.train === "recovery" ? "選手の疲労を回復しました。" : "練習で対象ポジションの選手を強化しました。";
  } else if (button.dataset.sign) {
    const candidate = state.market.find(player => player.id === Number(button.dataset.sign));
    if (candidate && ClubSim.sign(state, candidate.id)) message = `${candidate.name}を獲得しました。`;
  }
  if (!message) return;
  saveClub();
  render();
  if (button.hasAttribute("data-play")) panel.querySelector("[data-play]")?.focus();
  announce(message);
});

listen("edit-name", "click", () => {
  row("name-input").value = state.name;
  nameDialog.showModal();
  row("name-input").select();
});
listen("close-name", "click", () => nameDialog.close());
listen("name-form", "submit", event => {
  event.preventDefault();
  const input = row("name-input");
  const value = input.value.trim();
  if (!value) return input.focus();
  state.name = value.slice(0, 24);
  state.teams[0].name = state.name;
  saveClub();
  render();
  nameDialog.close();
  announce("クラブ名を変更しました。");
});

saveClub();
render();
