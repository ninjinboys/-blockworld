# LUX / NOX Cloudflare D1 ログイン設定

Firebaseは使用しません。Cloudflare Pages Functions + D1だけで、名前＋パスワードのアカウント、会話・記憶・写真の端末間同期を行います。

## Cloudflare管理画面で必要な設定

1. Cloudflare ダッシュボード > Storage & databases > D1 SQL database > Create database から **lux-nox-db** を作成します。
2. Workers & Pages > **LUX のPagesプロジェクト** > Settings > Bindings > Add > D1 database を選び、**Variable name = DB**、database = **lux-nox-db** として保存します。
3. **NOXのPagesプロジェクト**でも同じD1を **DB** という名前でバインドします。LUXとNOXが同じPagesプロジェクトの異なるパスの場合は、そのPagesプロジェクト1つだけに設定します。
4. D1バインディング追加後、各Pagesプロジェクトを再デプロイします。
5. サイトにアクセスし、「新規アカウント作成」から名前とパスワードを登録します。次の端末で同じ名前とパスワードでログインできます。

## 動作

- 同じD1データベースにアカウント情報を格納し、LUXとNOXの記憶を分離します。
- パスワードは PBKDF2-SHA256（210,000回、個別ランダムsalt）でハッシュ化して保存します。
- セッションはHttpOnly/Secure/SameSite=Lax Cookieで保持し、データベースにはトークンのSHA-256ハッシュのみ保存します。
- 会話・記憶はD1へ同期。写真は最大約800KBをD1に保存します。超過する画像は端末内保存のみです。
- 別端末からの変更は定期的に取り込みます。競合時は統合を試みますが、同時編集は完全保証できません。
- パスワード再設定機能は未実装です。パスワードを忘れると復旧できません。
- 名前は半角英数字・アンダースコアの3〜20文字、パスワードは10〜128文字です。
- 各PagesのセッションCookieはドメイン別なので、LUXとNOXの両方で一度ずつログインする必要があります。

## コード

- `functions/api/account.js`（共通ルート）
- `functions/nox/api/account.js`（/nox/ パス用）
- `lux/functions/api/account.js`（独立LUX）
- `nox/functions/api/account.js`（独立NOX）
- `lux/cloud-sync.js`、`nox/cloud-sync.js`（ログイン画面・同期）

テーブルは初回アクセス時に自動作成されます。D1バインディング名は必ず `DB` にしてください。
