const supported = new Set(['https://nexacraft.pages.dev', 'https://baseball-prime.pages.dev']);
const encoder = new TextEncoder();
const limit = 1_750_000;
const sessionLifetime = 30 * 86_400_000;
const usernamePattern = /^[a-z0-9_-]{3,24}$/;
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
const random = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000,
  }, key, 256));
}

function equalHash(left, right) {
  let different = left.length ^ right.length;
  for (let i = 0; i < left.length; i++) different |= left.charCodeAt(i) ^ (right.charCodeAt(i) || 0);
  return different === 0;
}

function tables(db) {
  return db.batch([
    'CREATE TABLE IF NOT EXISTS prime_accounts (username TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS prime_sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires_at INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS prime_saves (username TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS prime_auth_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL)',
  ].map(sql => db.prepare(sql)));
}

function validState(state) {
  const clubs = state?.clubs;
  return state?.teamConfigured === true && typeof state.teamName === 'string' &&
    state.teamName.length > 0 && state.teamName.length <= 24 &&
    Number.isInteger(state.year) && state.year >= 2026 &&
    Number.isInteger(state.game) && state.game >= 0 && state.game <= 143 &&
    Array.isArray(clubs) && clubs.length >= 12 && clubs.length <= 27 &&
    clubs[0]?.roster?.[0]?.career &&
    clubs.every(club => Array.isArray(club?.roster) && Array.isArray(club.order) && Array.isArray(club.rotation));
}

async function readRequest(request) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    throw Object.assign(Error('JSON形式で送信してください。'), {status: 415});
  }
  const reader = request.body?.getReader();
  if (!reader) throw Object.assign(Error('データがありません。'), {status: 400});
  const decoder = new TextDecoder();
  let total = 0;
  let text = '';
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw Object.assign(Error('セーブデータの容量上限を超えています。'), {status: 413});
    }
    text += decoder.decode(value, {stream: true});
  }
  try { return JSON.parse(text + decoder.decode()); }
  catch { throw Object.assign(Error('データの形式が不正です。'), {status: 400}); }
}

async function snapshot(db, username) {
  const row = await db.prepare('SELECT payload, revision FROM prime_saves WHERE username=?').bind(username).first();
  return row ? {state: JSON.parse(row.payload), revision: row.revision} : {state: null, revision: 0};
}

async function authenticate(db, request, body, respond) {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = body.password;
  if (!usernamePattern.test(username) || forbidden.has(username) ||
      typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return respond({error: 'ユーザーIDは半角3〜24文字、パスワードは8〜128文字で入力してください。'}, 400);
  }
  await tables(db);
  const now = Date.now(), window = Math.floor(now / 600_000);
  const bucket = await digest(window + ':' + (request.headers.get('CF-Connecting-IP') || 'unknown'));
  const count = await db.prepare('INSERT INTO prime_auth_limits VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits')
    .bind(bucket, now + 600_000).first();
  if (count.hits > 20) return respond({error: 'ログイン操作が多すぎます。時間をおいてお試しください。'}, 429);
  const token = random(32), tokenHash = await digest(token);
  const createSession = db.prepare('INSERT INTO prime_sessions VALUES(?,?,?)').bind(tokenHash, username, now + sessionLifetime);
  const prune = [
    db.prepare('DELETE FROM prime_sessions WHERE expires_at<=?').bind(now),
    db.prepare('DELETE FROM prime_auth_limits WHERE expires_at<=?').bind(now),
  ];
  if (body.action === 'register') {
    const state = body.state ?? null;
    if (state !== null && !validState(state)) return respond({error: '引き継ぐ球団データが不正です。'}, 400);
    const salt = random(16), hash = await passwordHash(password, salt);
    const statements = [db.prepare('INSERT INTO prime_accounts VALUES(?,?,?)').bind(username, salt, hash), ...prune, createSession];
    if (state !== null) statements.push(db.prepare('INSERT INTO prime_saves VALUES(?,?,1)').bind(username, JSON.stringify(state)));
    try { await db.batch(statements); }
    catch (error) {
      if (await db.prepare('SELECT 1 FROM prime_accounts WHERE username=?').bind(username).first()) {
        return respond({error: 'このユーザーIDはすでに使われています。'}, 409);
      }
      throw error;
    }
    return respond({username, token, state, revision: state === null ? 0 : 1}, 201);
  }
  const user = await db.prepare('SELECT salt,password_hash FROM prime_accounts WHERE username=?').bind(username).first();
  const hash = await passwordHash(password, user?.salt || 'baseball-prime-unused-login-salt');
  if (!user || !equalHash(hash, user.password_hash)) return respond({error: 'IDまたはパスワードが正しくありません。'}, 401);
  await db.batch([...prune, createSession]);
  return respond({username, token, ...await snapshot(db, username)});
}

export async function onRequest({request, env}) {
  const origin = request.headers.get('Origin');
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin'};
  if (supported.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
  if (origin && !supported.has(origin)) return respond({error: 'BASEBALL PRIMEから操作してください。'}, 403);
  if (request.method === 'OPTIONS') {
    if (!supported.has(origin)) return respond({error: 'このサイトからは利用できません。'}, 403);
    return new Response(null, {status: 204, headers: {
      ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    }});
  }
  const db = env.PENNANT_DB;
  if (!db) return respond({error: 'クラウド保存サーバーを利用できません。'}, 503);
  if (request.method === 'GET') return respond({available: true});
  if (request.method !== 'POST') return respond({error: 'この操作は利用できません。'}, 405);
  if (!supported.has(origin)) return respond({error: 'BASEBALL PRIMEから操作してください。'}, 403);
  try {
    const body = await readRequest(request);
    if (body?.action === 'register' || body?.action === 'login') return await authenticate(db, request, body, respond);
    const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) return respond({error: 'アカウントにログインしてください。'}, 401);
    const hash = await digest(token);
    const session = await db.prepare('SELECT username FROM prime_sessions WHERE token_hash=? AND expires_at>?').bind(hash, Date.now()).first();
    if (!session) return respond({error: 'アカウントにログインし直してください。'}, 401);
    const {username} = session;
    if (body?.action === 'load') return respond(await snapshot(db, username));
    if (body?.action === 'logout') {
      await db.prepare('DELETE FROM prime_sessions WHERE token_hash=?').bind(hash).run();
      return respond({ok: true});
    }
    if (body?.action !== 'save') return respond({error: 'この操作は利用できません。'}, 400);
    const {state, revision} = body;
    if (!validState(state) || !Number.isSafeInteger(revision) || revision < 0) {
      return respond({error: 'セーブデータの形式が不正です。'}, 400);
    }
    const payload = JSON.stringify(state);
    const updated = revision === 0
      ? await db.prepare('INSERT INTO prime_saves VALUES(?,?,1) ON CONFLICT(username) DO NOTHING RETURNING revision').bind(username, payload).first()
      : await db.prepare('UPDATE prime_saves SET payload=?,revision=revision+1 WHERE username=? AND revision=? RETURNING revision').bind(payload, username, revision).first();
    return updated
      ? respond({revision: updated.revision})
      : respond({error: '別の端末で更新されています。クラウドのセーブを確認してください。'}, 409);
  } catch (error) {
    if (error.status) return respond({error: error.message}, error.status);
    console.error('BASEBALL PRIME cloud save:', error.name);
    return respond({error: 'クラウド保存に接続できませんでした。'}, 500);
  }
}
