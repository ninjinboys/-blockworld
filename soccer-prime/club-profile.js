"use strict";

const ClubProfile = (() => {
  const prefix = "soccer-prime.club.v1";
  const key = id => id ? prefix + ".slot." + id : prefix;
  const activeKey = prefix + ".active";
  const profilesKey = prefix + ".profiles";

  function readJSON(name) {
    try { return JSON.parse(localStorage.getItem(name)); } catch { return null; }
  }

  function accounts() {
    const names = readJSON(profilesKey);
    return Array.isArray(names) ? names : [];
  }

  function current() {
    try {
      const id = localStorage.getItem(activeKey) || "";
      return accounts().some(account => account.id === id) ? id : "";
    } catch { return ""; }
  }

  function setCurrent(id) {
    try {
      if (id) localStorage.setItem(activeKey, id);
      else localStorage.removeItem(activeKey);
      return true;
    } catch { return false; }
  }

  function read(id) {
    const stored = readJSON(key(id));
    return ClubSim.validState(stored) ? ClubSim.hydrate(stored) : ClubSim.newClub();
  }

  function write(id, state) {
    try {
      localStorage.setItem(key(id), JSON.stringify(state));
      return true;
    } catch { return false; }
  }

  async function getHash(password, salt) {
    const bytes = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey("raw", bytes, "PBKDF2", false, ["deriveBits"]);
    const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 150000 }, key, 256);
    return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, "0")).join("");
  }

  async function register(name, password, guest) {
    if (!name || name.length > 20 || password.length < 6 || password.length > 64) {
      throw Error("名前は20文字以内、パスワードは6〜64文字で入力してください。");
    }
    if (accounts().some(acc => acc.name === name)) throw Error("この名前は登録済みです。");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await getHash(password, salt);
    const all = accounts();
    if (all.some(acc => acc.name === name)) throw Error("この名前は登録済みです。");
    const id = crypto.randomUUID();
    const account = { id, name, hash, salt: Array.from(salt) };
    if (!write(id, guest || ClubSim.newClub())) throw Error("ブラウザにセーブを作成できません。");
    try {
      localStorage.setItem(profilesKey, JSON.stringify([...all, account]));
      if (!setCurrent(id)) throw Error();
    } catch { throw Error("アカウントを保存できません。"); }
    return id;
  }

  async function login(name, password) {
    const account = accounts().find(acc => acc.name === name);
    if (!account || await getHash(password, Uint8Array.from(account.salt)) !== account.hash) {
      throw Error("名前またはパスワードが違います。");
    }
    if (!setCurrent(account.id)) throw Error("アカウントを読み込めません。");
    return account.id;
  }

  return { accounts, current, setCurrent, read, write, register, login };
})();
