"use strict";

const ClubViews = (() => {
  const S = ClubSim;
  const A = ClubScout;
  const nf = new Intl.NumberFormat("ja-JP");
  const n = number => nf.format(Number.isFinite(number) ? number : 0);
  const cash = number => `${n(number)}万円`;
  const h = value => String(value ?? "").replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const opt = (value, label, selected) => `<option value="${h(value)}"${selected ? " selected" : ""}>${h(label)}</option>`;
  const disable = condition => condition ? " disabled" : "";
  const rarity = value => `<span class="rarity rarity-${h(value)}">${h(value)}</span>`;
  const sign = value => value > 0 ? "+" + n(value) : n(value);
  const choice = (text, value = "—") => `<div class="summary-cell"><span>${h(text)}</span><strong>${value}</strong></div>`;
  const button = (label, action, value = "", detail = {}) =>
    `<button type="button" class="prime-button${detail.primary ? " primary" : ""}" data-${action}="${h(value)}"${disable(detail.disabled)}>${h(label)}</button>`;
  const table = (headers, rows, empty = "データはまだありません。") => rows.length
    ? `<div class="table-scroll"><table class="prime-table"><thead><tr>${headers.map(label => `<th scope="col">${h(label)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr${row.mine ? ' class="mine"' : ""}>${(row.cells || row).map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : `<p class="muted empty-view">${h(empty)}</p>`;
  const team = (s, id) => s.teams[id]?.name ?? "—";
  const level = s => S.divisions[S.seasonDivision(s)];
  const cap = s => S.capacities[s.venue.stands];

  function weekLabel(s) {
    const date = S.weekDate(s);
    if (S.seasonOver(s)) return `${S.yearLabel(s)}年 · シーズンオフ`;
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日〜${end.getMonth() + 1}月${end.getDate()}日`;
  }

  function nextMatchNote(s) {
    const next = S.matchForClub(s);
    return next ? `第${s.round + 1}節 · ${next.home ? "ホーム" : "アウェー"}` : "シーズンオフ";
  }

  function overview(s) {
    const own = s.table[0], power = S.teamPower(s);
    return [
      choice("シーズン", `${S.yearLabel(s)}年`),
      choice("消化試合", `${s.round}/${s.fixtures.length}`),
      choice("戦績", `${own.won}勝 ${own.lost}敗 ${own.drawn}分`),
      choice("ガチャコイン", n(s.coins)),
      choice("クラブ資金", cash(s.balance)),
      choice("クラブランク", `<span class="rank">${S.rank(power)}</span>`)
    ].join("");
  }

  function promotion(s) {
    const reqs = S.promotionConditions(s);
    if (!reqs.length) return `<div class="prime-box"><h2>クラブの昇格</h2><p>プロクラブとしてリーグ優勝を目指しましょう。</p></div>`;
    const available = reqs.every(([done]) => done) && S.seasonOver(s);
    return `<section class="prime-box"><h2>クラブの昇格</h2>
      <p>${s.promoted ? `昇格決定。来季は${S.divisions[s.division]}に参戦します。` : `${S.clubLevels[s.division]}から${S.clubLevels[s.division - 1]}へ`}</p>
      <ul class="check-list">${reqs.map(([done, label]) => `<li data-done="${!!done}"><span>${done ? "達成" : "未達成"}</span> ${h(label)}</li>`).join("")}</ul>
      ${s.promoted ? "" : button("クラブを昇格させる", "action", "promoteClub", { primary: true, disabled: !available })}
    </section>`;
  }

  function season(s) {
    const result = S.seasonResult(s);
    if (!result) return "";
    const draft = s.offseasonDraft;
    return `<section class="prime-box season-card">
      <h2>${S.yearLabel(s)}年 シーズン終了</h2>
      <p><strong>${result.place}位</strong> · 優勝 ${h(result.winner)} · 順位賞金 ${cash(result.prize)}</p>
      <p>クラブ得点王 ${h(result.topScorer)}</p>
      <div class="button-row">
        ${button(draft?.signed ? "ユース昇格済み" : "ユースドラフト", "action", "draft", { disabled: !!draft?.signed })}
        ${button("次のシーズンへ", "action", "nextSeason", { primary: true })}
      </div>
    </section>`;
  }

  function home(s) {
    const next = S.matchForClub(s);
    const last = s.results.at(-1);
    return `<section class="prime-stadium" aria-label="ホームスタジアム">
      <div class="stadium-copy"><span class="eyebrow">${h(level(s))}</span>
        <div class="club-name"><span class="club-crest" aria-hidden="true"></span><h1>${h(s.name)}</h1></div>
        <p class="stadium-title">ホームスタジアム</p>
        <ul class="venue-facts"><li>収容 <strong>${n(cap(s))}人</strong></li><li>ファン <strong>${n(s.venue.fans)}人</strong></li>
          ${last?.attendance ? `<li>前節の観客 <strong>${n(last.attendance)}人</strong></li>` : ""}</ul>
      </div>
    </section>
    <div class="prime-columns">
      ${next ? `<section class="prime-box match-card">
        <span class="eyebrow">${h(nextMatchNote(s))}</span><h2>次の試合　vs ${h(next.opponent.name)}</h2>
        <p class="muted">相手の戦術　${h(S.tactics[next.opponent.tactic].name)}</p>
        <div class="button-row">${button("1週間進める", "action", "week", { primary: true })}${button("日程を見る", "tab", "match")}</div>
      </section>` : season(s)}
      ${promotion(s)}
    </div>`;
  }

  function fixtureGrid(s) {
    const days = ["月", "火", "水", "木", "金", "土", "日"];
    const next = S.matchForClub(s);
    const optional = S.friendlyOptions(s);
    return `<div class="week-scroll"><div class="week-grid">${days.map(day => {
      const friendly = optional.find(item => item.day === day);
      const league = day === (next.home ? "土" : "日");
      return `<div class="day-card${league ? " league-day" : ""}">
        <strong>${day}曜日</strong>
        ${league ? `<span class="eyebrow">リーグ戦</span><span>${h(next.opponent.name)}</span><small>${next.home ? "ホーム" : "アウェー"}</small>`
          : friendly ? `<span class="muted">練習試合</span><span>${h(friendly.opponent.name)}</span>
            ${button(s.friendlies.includes(friendly.opponent.id) ? "選択済み" : "選択する", "friendly", friendly.opponent.id, { primary: s.friendlies.includes(friendly.opponent.id) })}`
            : '<span class="muted">試合なし</span>'}
      </div>`;
    }).join("")}</div></div>`;
  }

  function halfScore(match, start, end, id) {
    return match.events.filter(event => event.team === id && event.minute >= start && event.minute <= end).length;
  }

  function matchScore(s, match) {
    return `<div class="result-board"><span>${h(team(s, match.home))}</span><strong>${match.goals.join(" – ")}</strong><span>${h(team(s, match.away))}</span></div>
      ${table(["クラブ", "前半", "後半", "合計"], [match.home, match.away].map((id, index) => ({
        mine: id === 0, cells: [h(team(s, id)), halfScore(match, 0, 45, id), halfScore(match, 46, 90, id), match.goals[index]]
      })))}
      ${match.attendance ? `<p class="muted">ホーム観客 ${n(match.attendance)}人 ／ 入場収入 ${cash(match.gate)}</p>` : ""}`;
  }

  function match(s, ui) {
    const last = s.results.at(-1);
    const tail = s.results.slice(-12).reverse().map((m, index) => [
      s.round - index, h(team(s, m.home)), `<strong>${m.goals.join(" – ")}</strong>`, h(team(s, m.away))
    ]);
    const batch = ui.batch;
    return `${S.seasonOver(s) ? season(s) + promotion(s) : `<section class="prime-box">
      <h2>${h(level(s))}｜今週の試合日程</h2><p class="muted">${weekLabel(s)}。練習試合は選んだ分だけ行います。</p>
      ${fixtureGrid(s)}
      <div class="button-row">
        ${button("1週間進める・結果発表", "action", "week", { primary: true })}
        ${button("1ヶ月進める", "action", "month")}
        ${button("シーズン終了まで進める", "action", "endSeason")}
      </div>
    </section>`}
    ${batch ? `<section class="prime-box highlight"><h2>${h(batch.label)}の結果</h2><p>${batch.played}試合 · ${batch.won}勝 ${batch.lost}敗 ${batch.drawn}分</p></section>` : ""}
    ${last ? `<section class="prime-box"><div class="section-heading"><h2>直近の試合</h2>${button("試合を振り返る", "action", "replay")}</div>
      ${matchScore(s, last)}
      ${s.lastWeek?.friendlies?.length ? `<h3>練習試合</h3>${table(["対戦相手", "スコア", "獲得コイン"], s.lastWeek.friendlies.map(m =>
        [h(team(s, m.away)), m.goals.join(" – "), n(m.coins)]))}` : ""}
    </section>` : ""}
    <section class="prime-box"><h2>試合履歴</h2>${table(["節", "ホーム", "結果", "アウェー"], tail)}</section>`;
  }

  function lineup(s, ui) {
    const starters = S.lineupSlots(s);
    const selected = new Set(starters.map(slot => slot.player?.id));
    const select = (key, label, values) => `<label class="form-field">${label}<select data-setting="${key}">${Object.entries(values).map(([value, item]) =>
      opt(value, item.name || value, s[key] === value)).join("")}</select></label>`;
    const tactic = S.tactics[s.tactic];
    const bench = s.squad.filter(p => !selected.has(p.id));
    return `<section class="prime-box"><div class="section-heading"><h2>フォーメーション・スタメン</h2>${button("戦力優先で自動編成", "action", "autoLineup")}</div>
      <div class="form-pair">${select("formation", "フォーメーション", S.formations)}${select("tactic", "戦術", S.tactics)}</div>
      <p class="muted">${h(tactic.note)}</p>
      <div class="lineup-pitch" aria-label="先発の配置">${[...S.roles].reverse().map(role => `<div class="lineup-row">
        ${starters.filter(slot => slot.role === role).map(slot => `<div class="pitch-player"><b>${h(slot.player?.name.split(" ")[0] || role)}</b><small>${role}</small></div>`).join("")}
      </div>`).join("")}</div>
      ${table(["枠", "先発選手", "能力", "疲労"], starters.map(slot => [
        h(slot.slot),
        `<select data-slot="${slot.slot}" aria-label="${slot.slot}の選手">${s.squad.filter(p => p.role === slot.role).map(p => opt(p.id, `${p.name} · ${p.rar}`, p.id === slot.player?.id)).join("")}</select>`,
        slot.player?.skill ?? "—", slot.player?.fatigue ?? "—"
      ]))}
    </section>
    <section class="prime-box"><h2>控え・契約選手</h2>${table(["位置", "選手", "能力", "登録"], bench.map(p => [
      p.role, rarity(p.rar) + " " + h(p.name), p.skill,
      button("控え登録へ", "reserve", p.id, { disabled: s.squad.filter(x => x.role === p.role).length <= Math.max(...Object.values(S.formations).map(f => f[p.role])) })
    ]), "控え選手はいません。")}</section>
    <section class="prime-box"><h2>リザーブ</h2><p class="muted">ガチャ・ミッションで獲得した選手を登録できます。トップチームは最大${S.limit}人です。</p>
      ${table(["位置", "選手", "能力", "登録"], s.reserve.map(p => [
        p.role, rarity(p.rar) + " " + h(p.name), p.skill, button("トップに登録", "activate", p.id, { disabled: s.squad.length >= S.limit })
      ]), "リザーブに選手はいません。")}
    </section>`;
  }

  function gacha(s, ui) {
    const currentDay = A.dailyKey();
    const remaining = A.catalog.length - s.scouted.filter(id => id <= A.catalog.length).length;
    return `<section class="prime-box"><h2>スカウトガチャ</h2>
      <div class="small-summary">${choice("ガチャコイン", n(s.coins))}${choice("未所属選手", n(remaining))}${choice("UR以上確定まで", `${Math.max(1, 100 - s.pity)}回`)}</div>
      <p class="muted">通常排出率　${A.rates.map(([rar, rate]) => rar + " " + rate / 100 + "%").join(" / ")}<br>
      10連はSR以上が1枠確定。獲得選手は編成のリザーブへ入ります。</p>
      <div class="button-row gacha-actions">
        ${button("通常1回 · 300", "draw", "1:normal", { primary: true, disabled: s.coins < 300 || remaining < 1 })}
        ${button("通常10連 · 2,700", "draw", "10:normal", { primary: true, disabled: s.coins < 2700 || remaining < 10 })}
        ${button("ピックアップ · 300", "draw", "1:featured", { disabled: s.coins < 300 || remaining < 1 })}
        ${button("攻撃陣10連 · 2,700", "draw", "10:attack", { disabled: s.coins < 2700 || remaining < 10 })}
        ${button("守備陣10連 · 2,700", "draw", "10:defense", { disabled: s.coins < 2700 || remaining < 10 })}
        ${button("デイリー無料1回", "draw", "1:free", { disabled: s.daily === currentDay || remaining < 1 })}
      </div>
    </section>
    ${ui.drawn.length ? `<section class="prime-box"><h2>獲得選手</h2><div class="scout-grid">
      ${ui.drawn.map(p => `<article class="scout-card rarity-${h(p.rar)}"><span class="scout-crest" aria-hidden="true"></span>
        <div>${rarity(p.rar)} <strong>${h(p.name)}</strong><p class="muted">${p.role} · ${p.age}歳 · 能力 ${p.skill}</p></div></article>`).join("")}
      </div>${button("獲得選手を編成する", "tab", "lineup")}</section>` : ""}`;
  }

  function training(s, ui) {
    const closed = S.seasonOver(s);
    const sorted = [...s.squad].sort((a, b) => ui.trainingSort === "age" ? a.age - b.age : ui.trainingSort === "name"
      ? a.name.localeCompare(b.name, "ja") : b.skill - a.skill);
    return `<section class="prime-box"><h2>週間育成</h2>
      <p class="muted">選手ごとに練習を設定し、試合で1週間進めると育成結果が出ます。調子・疲労・成長タイプで伸びが変わります。</p>
      <div class="button-row">${button("おすすめを一括設定", "action", "autoTraining", { disabled: closed })}${button("全員休養", "action", "restAll", { disabled: closed })}</div>
      <label class="form-field compact-field">並び替え<select data-ui="trainingSort">
        ${Object.entries({ strength: "強さ順", age: "年齢順", name: "名前順" }).map(([key, label]) => opt(key, label, ui.trainingSort === key)).join("")}</select></label>
    </section>
    ${s.trainingReport.length ? `<section class="prime-box"><h2>先週の育成結果</h2><ul class="event-list">${s.trainingReport.map(item => `<li>${h(item)}</li>`).join("")}</ul></section>` : ""}
    <section class="prime-box">${sorted.map(p => `<article class="player-training">
      <div class="section-heading"><h3>${rarity(p.rar)} ${h(p.name)} <small>${p.role}</small></h3><b>能力 ${p.skill}</b></div>
      <p class="muted">${p.age}歳 · ${h(p.growth)}型 · 調子 ${p.condition}/5 · 疲労 ${p.fatigue} · 成長上限 ${p.potential}</p>
      <div class="ability-row">${Object.entries(S.stats).map(([key, label]) => `<span>${label} <b>${p.abilities[key]}</b></span>`).join("")}</div>
      <label class="form-field compact-field">今週の育成<select data-train="${p.id}" aria-label="${h(p.name)}の練習"${disable(closed)}>
        ${Object.entries(S.drills).filter(([key]) => key !== "keeping" || p.role === "GK")
          .map(([key, drill]) => opt(key, drill.name, (s.training[p.id] || "rest") === key)).join("")}
      </select></label>
    </article>`).join("")}</section>`;
  }

  function catalog(s, ui) {
    const all = A.catalog.concat(A.missions.map(item => item.player), s.drafted);
    const canonical = value => value.replace(/\s/g, "").toLowerCase();
    const term = canonical(ui.catalogSearch);
    const owned = new Map([...s.squad, ...s.reserve, ...s.retired].filter(p => p.catalog).map(p => [p.catalog, p]));
    const matches = all.filter(p => (!term || canonical(p.name).includes(term))
      && (ui.catalogRole === "all" || p.role === ui.catalogRole) && (ui.catalogRarity === "all" || p.rar === ui.catalogRarity));
    const pageSize = 30;
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    const page = Math.min(ui.catalogPage, pages - 1);
    const rows = matches.slice(page * pageSize, (page + 1) * pageSize).map(p => [
      rarity(p.rar), h(p.name), h(p.role), p.skill, p.potential, h(p.growth),
      p.youth || owned.has(p.catalog) ? "獲得済み" : "未獲得"
    ]);
    return `<section class="prime-box"><h2>選手名鑑</h2>
      <form id="catalog-form" class="catalog-search"><label class="form-field">名前検索
        <input name="search" type="search" placeholder="選手名を入力" value="${h(ui.catalogSearch)}" maxlength="32"></label>
        <button type="submit" class="prime-button">検索</button>
      </form>
      <div class="form-pair"><label class="form-field">ポジション<select data-ui="catalogRole">${opt("all", "全ポジション", ui.catalogRole === "all")}
        ${S.roles.map(role => opt(role, role, ui.catalogRole === role)).join("")}</select></label>
      <label class="form-field">レアリティ<select data-ui="catalogRarity">${opt("all", "すべて", ui.catalogRarity === "all")}
        ${S.rarities.map(rar => opt(rar, rar, ui.catalogRarity === rar)).join("")}</select></label></div>
      <div class="section-heading pagination"><p class="muted">${n(matches.length)}人 ／ 全${n(all.length)}人　${page + 1} / ${pages}ページ</p>
        <div class="button-row">${button("前へ", "page", page - 1, { disabled: page <= 0 })}${button("次へ", "page", page + 1, { disabled: page + 1 >= pages })}</div>
      </div>
      ${table(["レア", "選手", "位置", "初期能力", "上限", "成長", "所属"], rows, "条件に合う選手はいません。")}
    </section>`;
  }

  function records(s) {
    const power = S.teamPower(s);
    const playerRows = [...s.squad, ...s.reserve].filter(p => p.stats.games || p.career.games)
      .sort((a, b) => b.stats.goals - a.stats.goals || b.stats.assists - a.stats.assists || b.stats.games - a.stats.games);
    return `<section class="prime-box"><h2>クラブ戦力・ランク</h2><div class="small-summary">
        ${choice("戦力", power.toFixed(1))}${choice("現在のランク", `<span class="rank">${S.rank(power)}</span>`)}
        ${choice("通算勝利", `${s.career.wins}勝`)}</div></section>
      <section class="prime-box"><h2>${h(level(s))} 順位表</h2>${table(["順位", "クラブ", "試", "勝", "分", "敗", "得", "失", "差", "勝点"], S.standings(s).map((x, index) =>
        ({ mine: x.id === 0, cells: [index + 1, h(team(s, x.id)), x.played, x.won, x.drawn, x.lost, x.gf, x.ga, sign(x.gf - x.ga), x.points] })))}</section>
      <section class="prime-box"><h2>${S.yearLabel(s)}年 選手成績</h2>
      ${table(["位置", "選手", "出場", "得点", "アシスト", "無失点", "通算得点"], playerRows.map(p =>
        [p.role, h(p.name), p.stats.games, p.stats.goals, p.stats.assists, p.stats.cleanSheets, p.career.goals]))}</section>`;
  }

  function facilities(s) {
    const all = { stands: { name: "スタンド拡張", detail: "ホームスタジアムの収容人数を増やす。" }, ...S.facilities };
    return `<section class="prime-box"><h2>ホームスタジアム・練習施設</h2>
      <div class="small-summary">${choice("収容", n(cap(s)) + "人")}${choice("ホーム満員", s.venue.soldOuts + "回")}${choice("通算入場収入", cash(s.venue.gate))}</div>
      <div class="facility-grid">${Object.entries(all).map(([key, item]) => {
        const price = S.facilityPrice(s, key);
        const status = S.facilityStatus(s, key);
        return `<article class="facility-card"><h3>${h(item.name)}</h3><p class="muted">${h(item.detail)}${key === "stands" && !status ? ` 次は${n(S.capacities[s.venue.stands + 1])}席。` : ""}</p>
          ${button(status || `建設 · ${cash(price)}`, "facility", key, { disabled: !!status || s.balance < price })}</article>`;
      }).join("")}</div>
    </section>`;
  }

  function office(s, ui) {
    const last = s.results.at(-1);
    const wages = s.squad.reduce((sum, p) => sum + p.wage, 0);
    const coachPrice = s.coach * 1200;
    return `${facilities(s)}${promotion(s)}
      <section class="prime-box"><h2>クラブ経営</h2>
        <div class="small-summary">${choice("クラブ資金", cash(s.balance))}${choice("選手の合計週給", cash(wages))}
          ${choice("前節の収支", last ? sign(last.revenue - last.wages) + "万円" : "—")}</div>
        <div class="button-row">
          ${button(s.coach >= 5 ? "監督Lv.5" : `監督強化 Lv.${s.coach} · ${cash(coachPrice)}`, "action", "coach", { disabled: s.coach >= 5 || s.balance < coachPrice })}
          ${button("外国籍選手 · 2,500万円", "offer", "foreign", { disabled: s.balance < 2500 })}
          ${button("フリー移籍 · 4,500万円", "offer", "freeAgent", { disabled: s.balance < 4500 })}
          ${button("控え選手のトレード", "offer", "trade", { disabled: !s.reserve.some(p => ["N", "R", "SR"].includes(p.rar)) })}
          ${button("ユースドラフト", "action", "draft", { disabled: !S.seasonOver(s) || s.offseasonDraft?.signed })}
        </div>
      </section>
      <section class="prime-box"><h2>移籍候補</h2>${table(["選手", "位置", "能力", "獲得費", "移籍"], s.market.map(p => [
        rarity(p.rar) + " " + h(p.name), p.role, p.skill, cash(p.cost), button("獲得", "sign", p.id, { disabled: s.balance < p.cost })
      ]), "今週の候補は全員獲得済みです。")}</section>
      <section class="prime-box"><h2>マイクラブ・セーブ管理</h2><p>クラブ名　<strong>${h(s.name)}</strong></p>
        <p class="muted">${ui.profileName ? `${h(ui.profileName)} のセーブに保存中` : "ゲストセーブに保存中"}</p>
        <div class="button-row">${button("名前・カラー変更", "action", "editClub")}
          ${ui.profileName ? button("ログアウト", "action", "logout") : button("ログイン・新規登録", "profile", "login")}</div>
      </section>
      <section class="prime-box"><h2>収支履歴</h2>${table(["年", "節", "項目", "金額"], s.ledger.map(entry =>
        [2025 + entry.year, entry.round, h(entry.name), sign(entry.amount) + "万円"]))}</section>`;
  }

  function history(s) {
    const retired = s.retired;
    return `<section class="prime-box"><h2>クラブの歴史・年度表彰</h2>${table(["年", "大会", "順位", "成績", "優勝クラブ", "クラブ得点王"], [...s.honors].reverse().map(year => [
        2025 + year.year, h(S.divisions[year.division]), `${year.place}位${year.promoted || year.promotion ? " · 昇格" : ""}`,
        year.won === undefined ? "—" : `${year.won}勝 ${year.lost}敗 ${year.drawn}分`, h(year.winner || "—"), h(year.topScorer || "—")
      ]))}</section>
      <section class="prime-box"><h2>引退・殿堂入り・永久欠番</h2>${table(["選手", "引退年", "通算出場", "得点", "記念"], retired.map(p => [
        rarity(p.rar) + " " + h(p.name), 2025 + p.retiredYear, p.career.games, p.career.goals,
        `<div class="button-row">${button(p.hall ? "殿堂入り済" : "殿堂入り", "honor", p.id + ":hall", { disabled: !!p.hall })}${button(p.numberRetired ? "永久欠番済" : "永久欠番", "honor", p.id + ":numberRetired", { disabled: !!p.numberRetired })}</div>`
      ]), "引退した選手はいません。")}${retired.some(p => p.numberRetired) ? `<p>永久欠番　${retired.filter(p => p.numberRetired).map(p => `#${p.number} ${h(p.name)}`).join("、")}</p>` : ""}</section>`;
  }

  function missions(s) {
    return `<section class="prime-box"><h2>MR獲得ミッション</h2><p class="muted">条件を満たすとMR選手を獲得できます。MRはガチャから排出されません。</p>
      <div class="mission-grid">${A.missions.map((mission, index) => {
        const [current, goal] = mission.progress(s);
        const owned = s.missions.includes(index);
        return `<article class="mission-card"><h3>${rarity("MR")} ${h(mission.player.name)} <small>${mission.player.role}</small></h3>
          <p>${h(mission.label)}</p><progress value="${Math.max(0, Math.min(current, goal))}" max="${goal}"></progress><p class="muted">${Math.min(current, goal)} / ${goal}</p>
          ${button(owned ? "獲得済み" : current >= goal ? "獲得する" : "未達成", "claim", index, { primary: !owned && current >= goal, disabled: owned || current < goal })}</article>`;
      }).join("")}</div></section>`;
  }

  function draft(s) {
    const camp = s.offseasonDraft;
    if (!camp || !S.seasonOver(s)) return season(s) || '<section class="prime-box"><p>シーズン終了後にユース選手を指名できます。</p></section>';
    return `<section class="prime-box"><div class="section-heading"><h2>ユースドラフト</h2>${button("試合メニューへ戻る", "tab", "match")}</div>
      <p class="muted">候補から1人指名します。選手名と、特に伸ばす能力を設定できます。</p>
      ${camp.signed ? '<p class="highlight-text">今季のユース選手は指名済みです。</p>' : `<form id="draft-form">
        <fieldset class="draft-grid"><legend>候補選手</legend>${camp.candidates.map((p, i) => `<label class="draft-card">
          <input name="prospect" type="radio" value="${p.id}" ${i === 0 ? "checked" : ""}>
          <strong>${h(p.name)} · ${p.role}</strong><span class="muted">${p.age}歳　能力 ${p.skill}　上限 ${p.potential}</span>
        </label>`).join("")}</fieldset>
        <div class="form-pair"><label class="form-field">選手名（任意）<input name="name" maxlength="24"></label>
          <label class="form-field">重点育成<select name="stat">${Object.entries(S.stats).map(([key, value]) => opt(key, value, false)).join("")}</select></label></div>
        <button type="submit" class="prime-button primary">この選手を指名する</button>
      </form>`}
    </section>`;
  }

  function friend(s, ui) {
    const result = ui.battle;
    return `<section class="prime-box"><h2>フレンド対戦</h2><p class="muted">先発メンバーのチームコードを交換し、相手のクラブと1試合できます。</p>
      <label class="form-field">自分のチームコード<textarea id="your-team-code" readonly rows="2" spellcheck="false">${h(A.teamCode(s))}</textarea></label>
      ${button("コードをコピー", "action", "copyTeam")}
      <form id="battle-form"><label class="form-field">相手のチームコード<textarea name="code" maxlength="6004" rows="3" required spellcheck="false" placeholder="SP1-…"></textarea></label>
        <button type="submit" class="prime-button primary">このチームと対戦</button></form>
    </section>
    ${result ? `<section class="prime-box"><div class="section-heading"><h2>対戦結果</h2>${button("試合を見る", "action", "battleReplay")}</div>
      <div class="result-board"><span>${h(result.home.name)}</span><strong>${result.goals.join(" – ")}</strong><span>${h(result.away.name)}</span></div></section>` : ""}
    <section class="prime-box"><h2>PK戦</h2><p class="muted">CPUと交互にシュートとセーブをするモードです。</p>
      <a class="prime-button" href="./pk.html">PK戦で遊ぶ</a></section>`;
  }

  return { h, n, cash, weekLabel, overview, home, match, lineup, gacha, training, catalog, records, office, history, missions, draft, friend };
})();
