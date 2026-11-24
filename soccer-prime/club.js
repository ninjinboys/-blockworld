"use strict";

const S = ClubSim;
const A = ClubScout;
const P = ClubProfile;
const V = ClubViews;
const tabList = [
  ["home", "ホーム", "⌂"], ["match", "試合", "⚽"], ["friend", "対戦", "⇄"],
  ["lineup", "編成", "▤"], ["gacha", "ガチャ", "✦"], ["training", "育成", "◆"],
  ["catalog", "名鑑", "▣"], ["records", "記録", "▥"], ["office", "運営", "⚑"],
  ["history", "クラブ史", "◷"], ["missions", "MR獲得", "♛"]
];
const get = id => document.getElementById(id);
const listen = (id, event, handler) => get(id).addEventListener(event, handler);
const setupDialog = get("setup-dialog");
const profileDialog = get("profile-dialog");
const matchChoice = get("match-choice");
const viewer = get("match-viewer");
const content = get("club-view");
let profile = P.current();
let state = P.read(profile);
let activeTab = "home";
let ui = defaultUI();
let noticeTimer;
let watch = null;
let accountMode = "login";
let accountBusy = false;

function defaultUI() {
  return { drawn: [], batch: null, battle: null, trainingSort: "strength", catalogRole: "all", catalogRarity: "all", catalogSearch: "", catalogPage: 0, profileName: "" };
}

function notice(message) {
  const node = get("club-notice");
  clearTimeout(noticeTimer);
  node.textContent = message;
  node.hidden = false;
  noticeTimer = setTimeout(() => { node.hidden = true; }, 4100);
}

function persist(message) {
  const saved = P.write(profile, state);
  if (!saved) notice("ブラウザに保存できませんでした。この画面では続けて遊べます。");
  else if (message) notice(message);
  return saved;
}

function renderTabs() {
  get("club-tabs").innerHTML = tabList.map(([id, label, icon]) =>
    `<button type="button" data-tab="${id}" aria-current="${id === activeTab ? "page" : "false"}"><span aria-hidden="true">${icon}</span>${label}</button>`).join("");
  get("club-tabs").querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

function render() {
  ui.profileName = P.accounts().find(account => account.id === profile)?.name || "";
  get("title-start").textContent = state.configured ? "つづきから" : "はじめる";
  get("title-save").hidden = !state.configured;
  get("title-save").textContent = `${state.name} ／ ${S.yearLabel(state)}年`;
  document.body.style.setProperty("--team-color", state.color);
  if (get("game-screen").hidden) return;
  get("season-calendar").textContent = V.weekLabel(state);
  get("overview").innerHTML = V.overview(state);
  get("overview").hidden = !["home", "match"].includes(activeTab);
  get("profile-strip").textContent = ui.profileName ? `${ui.profileName} でプレイ中` : "ゲストプレイ";
  content.innerHTML = V[activeTab](state, ui);
  for (const button of get("club-tabs").querySelectorAll("button")) {
    button.setAttribute("aria-current", button.dataset.tab === activeTab ? "page" : "false");
  }
}

function selectTab(tab) {
  if (!Object.hasOwn(V, tab) || ![...tabList.map(([id]) => id), "draft"].includes(tab)) return;
  activeTab = tab;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
  get("club-tabs").querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

function showTitle() {
  get("game-screen").hidden = true;
  get("title-screen").hidden = false;
  document.body.classList.add("on-title");
  render();
  get("title-start").focus({ preventScroll: true });
}

function enterGame() {
  get("title-screen").hidden = true;
  get("game-screen").hidden = false;
  document.body.classList.remove("on-title");
  selectTab("home");
}

function reflectSetup() {
  get("setup-preview").textContent = get("club-name-input").value.trim() || "クラブ名を入力";
  get("setup-crest").style.setProperty("--team-color", get("club-color").value);
}

function setup() {
  get("setup-title").textContent = state.configured ? "クラブ情報を変更" : "自分のクラブを作ろう";
  get("setup-description").hidden = state.configured;
  get("setup-save").textContent = state.configured ? "変更を保存" : "このクラブでゲーム開始";
  get("club-name-input").value = state.name;
  get("club-color").innerHTML = Object.entries(S.colors).map(([color, label]) =>
    `<option value="${color}"${color === state.color ? " selected" : ""}>${label}</option>`).join("");
  reflectSetup();
  setupDialog.showModal();
}

function profileForm(mode) {
  if (accountBusy) return;
  accountMode = mode === "register" ? "register" : "login";
  const register = accountMode === "register";
  get("profile-title").textContent = register ? "アカウントを作成" : "アカウントでログイン";
  get("profile-submit").textContent = register ? "新規登録" : "ログイン";
  get("profile-password").autocomplete = register ? "new-password" : "current-password";
  get("profile-password").value = "";
  get("profile-error").textContent = "";
  get("use-guest").hidden = !register || !!profile || !state.configured;
  for (const button of profileDialog.querySelectorAll("[data-profile]")) {
    button.classList.toggle("primary", button.dataset.profile === accountMode);
  }
  if (!profileDialog.open) profileDialog.showModal();
  get("profile-name").focus();
}

function onProfile(id) {
  profile = id;
  state = P.read(id);
  ui = defaultUI();
  activeTab = "home";
  showTitle();
  if (state.configured) enterGame();
}

function showChoice() {
  const next = S.matchForClub(state);
  if (!next || matchChoice.open) return;
  get("match-choice-copy").textContent = `第${state.round + 1}節　vs ${next.opponent.name}${state.friendlies.length ? ` ／ 練習試合 ${state.friendlies.length}試合` : ""}`;
  matchChoice.showModal();
}

function week(shouldWatch) {
  if (!matchChoice.open) return;
  matchChoice.close();
  if (!S.finishRound(state)) return;
  ui.batch = null;
  persist(shouldWatch ? "" : "試合と育成の結果を更新しました。");
  selectTab("match");
  if (shouldWatch) openWatch(state.results.at(-1));
}

function runBatch(mode) {
  if (S.seasonOver(state)) return;
  const before = { ...state.table[0] };
  const start = state.round;
  const rounds = mode === "month" ? 4 : state.fixtures.length - state.round;
  for (let round = 0; round < rounds && !S.seasonOver(state); round++) S.finishRound(state);
  const after = state.table[0];
  ui.batch = {
    label: mode === "month" ? "1ヶ月" : "シーズン終了まで",
    played: state.round - start, won: after.won - before.won, lost: after.lost - before.lost, drawn: after.drawn - before.drawn
  };
  persist(`${ui.batch.played}試合分の結果を更新しました。`);
  selectTab("match");
}

function openWatch(match, friend = false) {
  if (!match) return;
  const names = friend ? [match.home.name, match.away.name] : [state.teams[match.home].name, state.teams[match.away].name];
  const teamIds = friend ? [0, 1] : [match.home, match.away];
  watch = { match, names, teamIds, minute: 0 };
  drawWatch();
  viewer.showModal();
}

function drawWatch() {
  const { names, teamIds, match, minute } = watch;
  const goals = match.events.filter(event => event.minute <= minute);
  const score = teamIds.map(id => goals.filter(event => event.team === id).length);
  const newest = goals.at(-1);
  const side = newest ? teamIds.indexOf(newest.team) : -1;
  const status = minute === 90 ? "試合終了" : minute === 45 ? "ハーフタイム" : "キックオフ";
  const notes = goals.length ? goals.map(event => `<li><strong>${event.minute}′</strong><span>${V.h(event.name || names[teamIds.indexOf(event.team)])} ゴール</span></li>`)
    : [`<li><span>${minute ? "得点はありません。" : "キックオフ。前半を進めてください。"}</span></li>`];
  get("watch-body").innerHTML = `<div class="watch-state"><strong>${status}</strong><span>${minute}′ / 90′</span></div>
    <div class="result-board"><span>${V.h(names[0])}</span><strong>${score.join(" – ")}</strong><span>${V.h(names[1])}</span></div>
    <div class="watch-pitch" data-goal-side="${side}" aria-hidden="true"><span class="penalty-area left"></span><span class="penalty-area right"></span><span class="watch-ball"></span></div>
    <ul class="watch-events" aria-label="得点経過">${notes.join("")}</ul>`;
  get("watch-next").textContent = minute === 0 ? "前半を進める" : minute === 45 ? "後半を進める" : "閉じる";
  get("watch-finish").hidden = minute === 90;
}

function update(message, focusSelector) {
  persist(message);
  render();
  if (focusSelector) content.querySelector(focusSelector)?.focus({ preventScroll: true });
}

const actions = {
  week: showChoice,
  month: () => runBatch("month"),
  endSeason: () => runBatch("endSeason"),
  replay: () => openWatch(state.results.at(-1)),
  battleReplay: () => openWatch(ui.battle, true),
  autoLineup() {
    state.selection = {};
    update("戦力と疲労に合わせて自動編成しました。", '[data-action="autoLineup"]');
  },
  autoTraining() {
    const options = { GK: "keeping", DF: "defending", MF: "passing", FW: "shooting" };
    if (S.seasonOver(state)) return;
    for (const player of state.squad) S.setTraining(state, player.id, player.fatigue > 34 ? "rest" : options[player.role]);
    update("ポジションと疲労に合わせて練習を設定しました。", '[data-action="autoTraining"]');
  },
  restAll() {
    if (S.seasonOver(state)) return;
    for (const player of state.squad) S.setTraining(state, player.id, "rest");
    update("全員を休養に設定しました。", '[data-action="restAll"]');
  },
  promoteClub() {
    if (!S.promoteClub(state)) return;
    update(`${S.clubLevels[state.division]}へ昇格しました。`);
  },
  nextSeason() {
    if (!S.nextSeason(state)) return;
    ui.batch = null;
    persist(`${S.yearLabel(state)}年のシーズンを開始しました。`);
    selectTab("home");
  },
  draft() {
    if (!S.openDraft(state)) return;
    persist();
    selectTab("draft");
  },
  coach() {
    const cost = state.coach * 1200;
    if (state.coach >= 5 || state.balance < cost) return;
    state.balance -= cost;
    state.coach++;
    S.addLedger(state, "監督強化", -cost);
    update(`監督がLv.${state.coach}になりました。`);
  },
  editClub: setup,
  logout() {
    if (!P.setCurrent("")) return notice("セーブの切り替えに失敗しました。");
    onProfile("");
    notice("ゲストセーブに切り替えました。");
  },
  async copyTeam() {
    const field = get("your-team-code");
    try {
      await navigator.clipboard.writeText(field.value);
      notice("チームコードをコピーしました。");
    } catch {
      field.focus();
      field.select();
      notice("選択したチームコードをコピーできます。");
    }
  }
};

function activate(button) {
  const data = button.dataset;
  if (data.tab) return selectTab(data.tab);
  if (data.profile) return profileForm(data.profile);
  if (data.action && Object.hasOwn(actions, data.action)) return actions[data.action]();
  if (data.friendly) {
    const id = Number(data.friendly);
    if (!S.friendlyOptions(state).some(({ opponent }) => opponent.id === id)) return;
    const selected = state.friendlies.includes(id);
    state.friendlies = selected ? state.friendlies.filter(other => other !== id) : [...state.friendlies, id];
    return update(selected ? "練習試合の選択を解除しました。" : "今週の練習試合に追加しました。", `[data-friendly="${id}"]`);
  }
  if (data.draw) {
    const [count, kind] = data.draw.split(":");
    const result = A.draw(state, Number(count), kind);
    if (!result) return notice("条件に合う選手またはコインが足りません。");
    ui.drawn = result;
    return update(`${result.length}人の選手を獲得しました。`);
  }
  if (data.facility && S.buyFacility(state, data.facility)) return update("スタジアム・練習施設を更新しました。");
  if (data.activate && S.promotePlayer(state, Number(data.activate))) return update("トップチームに登録しました。");
  if (data.reserve && S.sendToReserve(state, Number(data.reserve))) return update("リザーブに移しました。");
  if (data.sign && S.sign(state, Number(data.sign))) return update("移籍候補の選手を獲得しました。");
  if (data.offer) {
    const player = A.offer(state, data.offer);
    return player ? update(`${player.name}を獲得しました。`) : notice("現在は条件に合う選手がいません。");
  }
  if (data.claim) {
    const player = A.claim(state, Number(data.claim));
    if (player) update(`MR ${player.name}を獲得しました。`);
    return;
  }
  if (data.page !== undefined) {
    ui.catalogPage = Math.max(0, Number(data.page) || 0);
    render();
    return;
  }
  if (data.honor) {
    const [id, key] = data.honor.split(":");
    const player = state.retired.find(item => item.id === Number(id));
    if (player && ["hall", "numberRetired"].includes(key)) {
      player[key] = true;
      update(key === "hall" ? "殿堂入りに登録しました。" : "永久欠番に登録しました。");
    }
  }
}

document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (button && !button.disabled) activate(button);
});

content.addEventListener("change", event => {
  const input = event.target;
  if (input.tagName !== "SELECT") return;
  const data = input.dataset;
  const settings = { formation: S.formations, tactic: S.tactics };
  if (Object.hasOwn(settings, data.setting) && Object.hasOwn(settings[data.setting], input.value)) {
    state[data.setting] = input.value;
    update("", `[data-setting="${data.setting}"]`);
  } else if (data.slot && S.setStarter(state, data.slot, Number(input.value))) {
    update("", `[data-slot="${data.slot}"]`);
  } else if (data.train && S.setTraining(state, Number(data.train), input.value)) {
    persist();
  } else if (["catalogRole", "catalogRarity", "trainingSort"].includes(data.ui)) {
    ui[data.ui] = input.value;
    ui.catalogPage = 0;
    render();
    content.querySelector(`[data-ui="${data.ui}"]`)?.focus({ preventScroll: true });
  }
});

content.addEventListener("submit", event => {
  const form = event.target;
  const fields = new FormData(form);
  event.preventDefault();
  if (form.id === "catalog-form") {
    ui.catalogSearch = String(fields.get("search")).trim();
    ui.catalogPage = 0;
    render();
  } else if (form.id === "draft-form" && S.signYouth(state, Number(fields.get("prospect")), String(fields.get("name")), String(fields.get("stat")))) {
    update("ユース選手を指名しました。");
  } else if (form.id === "battle-form") {
    const away = A.parseCode(String(fields.get("code")).trim());
    if (!away) return notice("有効なSOCCER PRIMEのチームコードを入力してください。");
    ui.battle = A.friendlyBattle(state, away);
    render();
    openWatch(ui.battle, true);
  }
});

listen("title-start", "click", () => state.configured ? enterGame() : setup());
listen("return-title", "click", showTitle);
listen("close-setup", "click", () => setupDialog.close());
listen("club-name-input", "input", reflectSetup);
listen("club-color", "change", reflectSetup);
listen("setup-form", "submit", event => {
  event.preventDefault();
  const field = get("club-name-input");
  const name = field.value.trim().slice(0, 24);
  if (!name || state.teams.slice(1).some(team => team.name === name)) {
    field.setCustomValidity(name ? "対戦相手とは異なるクラブ名を入力してください。" : "クラブ名を入力してください。");
    field.reportValidity();
    return;
  }
  const created = !state.configured;
  state.configured = true;
  state.name = name;
  state.teams[0].name = name;
  state.color = get("club-color").value;
  setupDialog.close();
  persist(created ? "地域大会からクラブ運営を始めます。" : "クラブ情報を変更しました。");
  if (created) enterGame();
  else render();
});
listen("club-name-input", "input", () => get("club-name-input").setCustomValidity(""));

listen("close-profile", "click", () => { if (!accountBusy) profileDialog.close(); });
listen("profile-dialog", "cancel", event => { if (accountBusy) event.preventDefault(); });
listen("profile-form", "submit", async event => {
  event.preventDefault();
  if (accountBusy) return;
  accountBusy = true;
  get("profile-submit").disabled = true;
  const name = get("profile-name").value.trim();
  const password = get("profile-password").value;
  const useGuest = !profile && state.configured && get("use-guest-check").checked;
  try {
    const id = accountMode === "register" ? await P.register(name, password, useGuest ? state : null) : await P.login(name, password);
    profileDialog.close();
    onProfile(id);
    notice(`${name} でログインしました。`);
  } catch (error) {
    get("profile-error").textContent = error.message || "アカウントを読み込めませんでした。";
  } finally {
    get("profile-password").value = "";
    get("profile-submit").disabled = false;
    accountBusy = false;
  }
});

listen("close-choice", "click", () => matchChoice.close());
listen("choose-watch", "click", () => week(true));
listen("choose-skip", "click", () => week(false));
listen("close-watch", "click", () => viewer.close());
listen("watch-next", "click", () => {
  if (watch.minute === 90) viewer.close();
  else {
    watch.minute += 45;
    drawWatch();
  }
});
listen("watch-finish", "click", () => {
  watch.minute = 90;
  drawWatch();
  get("watch-next").focus();
});

renderTabs();
showTitle();
