"use strict";

const byId = (id) => document.getElementById(id);
const matchScore = byId("match-score");
const matchRounds = byId("match-rounds");
const practiceScore = byId("practice-score");
const arena = byId("arena");
const controls = document.querySelector(".controls");
const action = byId("action");
const marker = byId("marker");
const keeper = byId("keeper");
const keeperSprite = keeper.firstElementChild;
const ball = byId("ball");
const ballSprite = ball.firstElementChild;
const resultOverlay = byId("result-overlay");
const helpDialog = byId("help-dialog");
const laneButtons = [...document.querySelectorAll("[data-lane]")];
const targets = [...document.querySelectorAll(".target")];
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const laneNames = ["左", "中央", "右"];
const lanePositions = [39, 57.1, 75.2];
const regularRounds = 5;
const storagePrefix = "soccer-prime.";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const shotResults = {
  goal: { label: "GOAL!", detail: "ゴール", goal: true },
  save: { label: "SAVE!", detail: "キーパーが止めた", goal: false },
  miss: { label: "OFF TARGET", detail: "枠の外へ", goal: false }
};
const turnCopy = {
  home: {
    tag: "あなたのシュート",
    phase: "ATTACK",
    title: "シュートを決めろ",
    instruction: "コースを選び、ゲージが緑のゾーンに入ったら蹴ろう。",
    course: "シュートコース",
    action: "シュート"
  },
  away: {
    tag: "CPUのシュート",
    phase: "DEFENSE",
    title: "ゴールを守れ",
    instruction: "オレンジに光るコースを読み、緑のゾーンでセーブ。",
    course: "セーブするコース",
    action: "セーブ"
  }
};

let mode = "match";
let side = "home";
let phase = "ready";
let lane = 1;
let round = 1;
let history = { home: [], away: [] };
let scores = { home: 0, away: 0 };
let practiceStreak = 0;
let practiceBest = Number(readSetting("best")) || 0;
let soundOn = readSetting("sound") === "on";
let audio;
let startTime = performance.now();
let pausedAt = null;
let cpuShot = 1;
let cueLane = null;
let animations = [];
let playId = 0;
let nextTimer;

function readSetting(key) {
  try {
    return localStorage.getItem(storagePrefix + key);
  } catch {
    return null;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(storagePrefix + key, String(value));
  } catch {
    // Play remains available when browser storage is disabled.
  }
}

function syncSound() {
  byId("sound").setAttribute("aria-pressed", String(soundOn));
  byId("sound").setAttribute("aria-label", soundOn ? "効果音をオフにする" : "効果音をオンにする");
  byId("sound-label").textContent = soundOn ? "効果音 ON" : "効果音 OFF";
}

function playTone(frequency, endFrequency, duration, volume, delay = 0) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!soundOn || !Audio) return;
  try {
    audio ??= new Audio();
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const time = audio.currentTime + delay;
    const wave = audio.createOscillator();
    const gain = audio.createGain();
    wave.frequency.setValueAtTime(frequency, time);
    wave.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(.001, time + duration);
    wave.connect(gain).connect(audio.destination);
    wave.start(time);
    wave.stop(time + duration);
  } catch {
    // Audio restrictions do not affect the game.
  }
}

function announce(copy) {
  byId("announcement").textContent = copy;
}

function updateScore() {
  byId("home-score").textContent = scores.home;
  byId("away-score").textContent = scores.away;
  byId("practice-goals").textContent = scores.home;
  byId("practice-attempts").textContent = history.home.length;
  byId("practice-best").textContent = practiceBest;
  byId("round-label").textContent = round <= regularRounds ? `第${round}ラウンド` : "サドンデス";
  for (const team of ["home", "away"]) {
    const host = byId(`${team}-kicks`);
    const firstIndex = round <= regularRounds ? 0 : round - 1;
    const count = round <= regularRounds ? regularRounds : 1;
    const dots = Array.from({ length: count }, (_, index) => {
      const attempt = firstIndex + index;
      const result = history[team][attempt];
      const dot = document.createElement("span");
      dot.className = "kick-dot";
      if (result) {
        dot.classList.add(result.goal ? "goal" : "miss");
        dot.textContent = result.goal ? "✓" : "×";
      } else if (phase === "ready" && side === team && history[team].length === attempt) {
        dot.classList.add("current");
      }
      dot.setAttribute("aria-label", `${attempt + 1}本目 ${result?.detail ?? "未実施"}`);
      dot.title = result?.detail ?? "未実施";
      return dot;
    });
    host.replaceChildren(...dots);
  }
}

function updateLane(value) {
  lane = value;
  for (const button of laneButtons) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.lane) === lane));
  }
}

function updateCue(value) {
  if (cueLane === value) return;
  if (cueLane !== null) targets[cueLane].classList.remove("cue");
  cueLane = value;
  if (cueLane !== null) targets[cueLane].classList.add("cue");
}

function updatePhase(value) {
  phase = value;
  arena.dataset.phase = phase;
  for (const button of laneButtons) button.disabled = phase !== "ready";
  action.disabled = phase === "flight";
  const label = {
    ready: turnCopy[side].action,
    flight: "プレー中",
    result: "次のプレー",
    finished: "もう一度プレイ"
  };
  byId("action-label").textContent = label[phase];
  byId("action-key").hidden = phase === "flight";
}

function clearPlay() {
  playId += 1;
  clearTimeout(nextTimer);
  for (const animation of animations) animation.cancel();
  animations = [];
  updateCue(null);
  resultOverlay.hidden = true;
}

function readyTurn() {
  clearPlay();
  const copy = turnCopy[side];
  arena.dataset.side = side;
  controls.dataset.side = side;
  byId("arena-tag").textContent = mode === "practice" ? "シュート練習" : copy.tag;
  byId("phase-label").textContent = copy.phase;
  byId("turn-title").textContent = copy.title;
  byId("turn-copy").textContent = copy.instruction;
  byId("course-label").textContent = copy.course;
  byId("meter-caption").textContent = "緑で止める";
  byId("meter-caption").style.color = "";
  const counter = byId("kick-counter");
  const kickNumber = mode === "practice" ? history.home.length + 1 : round;
  counter.textContent = String(kickNumber).padStart(2, "0");
  if (mode === "match" && round <= regularRounds) {
    const total = document.createElement("small");
    total.textContent = " / 05";
    counter.append(total);
  }
  cpuShot = Math.floor(Math.random() * lanePositions.length);
  updateLane(1);
  updatePhase("ready");
  updateScore();
  startTime = performance.now();
}

function resetGame(nextMode = mode) {
  mode = nextMode;
  side = "home";
  round = 1;
  scores = { home: 0, away: 0 };
  history = { home: [], away: [] };
  practiceStreak = 0;
  for (const button of modeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  }
  matchScore.hidden = mode === "practice";
  matchRounds.hidden = mode === "practice";
  practiceScore.hidden = mode !== "practice";
  readyTurn();
  announce(mode === "practice" ? "シュート練習を開始しました" : "PK戦を開始しました");
}

function meterPosition(now) {
  const sweep = side === "home" ? 1100 : 1000;
  const elapsed = Math.max(0, (pausedAt ?? now) - startTime) + sweep * .16;
  return 1 - Math.abs(1 - ((elapsed / sweep) % 2));
}

function moveMeter(now) {
  if (phase === "ready" && pausedAt === null) {
    const position = meterPosition(now);
    marker.style.left = `${position * 100}%`;
    const cueVisible = side === "away" && (position > .14 && position < .43 || position > .57 && position < .86);
    updateCue(cueVisible ? cpuShot : null);
  }
  requestAnimationFrame(moveMeter);
}

function homeShot(error) {
  const keeperLane = Math.floor(Math.random() * lanePositions.length);
  const onTarget = error <= .24;
  const saveChance = error <= .04 ? .07 : error <= .11 ? .52 : .91;
  const takesSave = keeperLane === lane && Math.random() < saveChance;
  const result = !onTarget ? shotResults.miss : takesSave ? shotResults.save : shotResults.goal;
  return { result, shotLane: lane, keeperLane };
}

function awayShot(error) {
  const takesSave = lane === cpuShot && error <= .11;
  return {
    result: takesSave ? shotResults.save : shotResults.goal,
    shotLane: cpuShot,
    keeperLane: lane
  };
}

function timingText(error) {
  if (error <= .04) return "PERFECT";
  if (error <= .11) return "GOOD";
  if (error <= .24) return "あと少し";
  return "タイミングを外した";
}

function animateShot({ result, shotLane, keeperLane }, error) {
  const finalX = lanePositions[shotLane];
  const finalY = result === shotResults.miss ? 25 : result === shotResults.save ? 51 : error <= .04 ? 38 : 46;
  const keeperX = lanePositions[keeperLane];
  const rotation = (keeperLane - 1) * 64;
  const motionSpeed = reducedMotion.matches ? 120 : 620;
  const duration = { duration: motionSpeed, fill: "forwards", easing: "cubic-bezier(.2,.7,.5,1)" };
  const ballMotion = [
    { left: "27.4%", top: "86.5%" },
    { left: `${(27.4 + finalX * 2) / 3}%`, top: `${finalY + 9}%`, offset: .63 },
    { left: `${finalX}%`, top: `${finalY}%` }
  ];
  const keeperMotion = [
    { left: "57.1%", top: "58.5%" },
    { left: `${keeperX}%`, top: keeperLane === 1 ? "57.4%" : "56.5%" }
  ];
  animations = [
    ball.animate(ballMotion, duration),
    ballSprite.animate([
      { transform: "translate(-50%, 50%) scale(1) rotate(0)" },
      { transform: "translate(-50%, 50%) scale(.33) rotate(310deg)" }
    ], duration),
    keeper.animate(keeperMotion, { ...duration, delay: reducedMotion.matches ? 0 : 105 }),
    keeperSprite.animate([
      { transform: "translateX(-50%) rotate(0deg)" },
      { transform: `translateX(-50%) rotate(${rotation}deg) scale(${keeperLane === 1 ? 1.13 : 1})` }
    ], { ...duration, delay: reducedMotion.matches ? 0 : 105 })
  ];
  return motionSpeed + (reducedMotion.matches ? 0 : 110);
}

function matchWinner() {
  const difference = scores.home - scores.away;
  if (round <= regularRounds) {
    if (difference > regularRounds - history.away.length) return "home";
    if (-difference > regularRounds - history.home.length) return "away";
  } else if (history.home.length === history.away.length && difference !== 0) {
    return difference > 0 ? "home" : "away";
  }
  return null;
}

function settlePlay(play, error) {
  const { result } = play;
  history[side].push(result);
  if (result.goal) scores[side] += 1;
  if (mode === "practice") {
    practiceStreak = result.goal ? practiceStreak + 1 : 0;
    if (practiceStreak > practiceBest) {
      practiceBest = practiceStreak;
      saveSetting("best", practiceBest);
    }
  }
  const favorable = side === "home" ? result.goal : !result.goal;
  const winner = mode === "match" ? matchWinner() : null;
  const quality = timingText(error);
  resultOverlay.dataset.tone = (winner ? winner === "home" : favorable) ? "good" : "bad";
  resultOverlay.hidden = false;
  byId("result-main").textContent = winner ? (winner === "home" ? "YOU WIN!" : "CPU WINS") : result.label;
  const detail = side === "away" ? (result.goal ? "CPUのゴール" : "ナイスセーブ") : result.detail;
  const summary = winner ? `${scores.home} – ${scores.away}　${winner === "home" ? "あなたの勝利" : "CPUの勝利"}` : detail;
  byId("result-sub").textContent = summary;
  byId("meter-caption").textContent = quality;
  byId("meter-caption").style.color = error <= .11 ? "var(--lime)" : "var(--orange)";
  updatePhase(winner ? "finished" : "result");
  updateScore();
  announce(`${detail}。タイミング ${quality}。${winner ? summary : ""}`);
  if (favorable) {
    playTone(392, 440, .16, .09);
    playTone(523, 660, .21, .08, .12);
  } else {
    playTone(161, 90, .22, .13);
  }
}

function mainAction() {
  if (phase === "flight" || helpDialog.open) return;
  if (phase === "finished") {
    resetGame();
    return;
  }
  if (phase === "result") {
    if (mode === "match") {
      if (side === "away") round += 1;
      side = side === "home" ? "away" : "home";
    }
    readyTurn();
    announce(turnCopy[side].tag);
    return;
  }
  const position = meterPosition(performance.now());
  const error = Math.abs(position - .5);
  marker.style.left = `${position * 100}%`;
  updateCue(null);
  updatePhase("flight");
  const play = side === "home" ? homeShot(error) : awayShot(error);
  playTone(109, 36, .15, .18);
  const duration = animateShot(play, error);
  const activeId = playId;
  nextTimer = setTimeout(() => {
    if (activeId === playId) settlePlay(play, error);
  }, duration);
}

for (const button of laneButtons) {
  button.addEventListener("click", () => {
    if (phase === "ready") updateLane(Number(button.dataset.lane));
  });
}
for (const button of modeButtons) {
  button.addEventListener("click", () => {
    if (button.dataset.mode !== mode) resetGame(button.dataset.mode);
  });
}
action.addEventListener("click", mainAction);
byId("reset").addEventListener("click", () => resetGame());
byId("sound").addEventListener("click", () => {
  soundOn = !soundOn;
  syncSound();
  saveSetting("sound", soundOn ? "on" : "off");
  playTone(490, 660, .12, .1);
});
byId("help").addEventListener("click", () => {
  pausedAt = performance.now();
  helpDialog.showModal();
});
byId("dismiss-help").addEventListener("click", () => helpDialog.close());
byId("continue-button").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("close", () => {
  if (pausedAt !== null) startTime += performance.now() - pausedAt;
  pausedAt = null;
});
document.addEventListener("keydown", (event) => {
  if (event.altKey || event.metaKey || event.ctrlKey || event.repeat || helpDialog.open) return;
  const focusedButton = event.target.closest("button");
  if (event.code === "Space" && (!focusedButton || focusedButton === action || focusedButton.matches("[data-lane]"))) {
    event.preventDefault();
    mainAction();
    return;
  }
  if (phase !== "ready") return;
  const keys = { "1": 0, "2": 1, "3": 2 };
  if (Object.hasOwn(keys, event.key)) {
    event.preventDefault();
    updateLane(keys[event.key]);
    announce(`${laneNames[lane]}のコース`);
  }
});

syncSound();
resetGame();
requestAnimationFrame(moveMeter);
