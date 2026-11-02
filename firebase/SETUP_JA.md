# LUX / NOX 名前＋パスワードのログインと端末間同期

LUXとNOXはNEXACRAFTと同じ「名前」「パスワード」でログインする。Googleアカウントは不要。

## Firebaseの初期設定（サイト管理者のみ）
1. https://console.firebase.google.com/ でFirebaseプロジェクトを1つ作成する。
2. Webアプリを登録し、表示される firebaseConfig をコピーする。
3. Authentication → Sign-in method → **メール/パスワード**を有効にする（Googleプロバイダーは不要）。
4. Firestore Databaseを作成し、リポジトリの `firebase/firestore.rules` をFirestore Rulesへ設定して公開する。既存プロジェクトを使う場合は既存ルールを上書きしないよう統合する。
5. LUXとNOXそれぞれの「連携設定」に同じfirebaseConfigを貼り付ける。サイトごと、端末ごとに初回設定が必要。

## 利用方法
- 「新規アカウント作成」で名前（半角英数字・アンダースコア、3〜20文字）とパスワード（8文字以上）を設定する。
- 2台目の端末では「ログイン」で同じ名前とパスワードを入力する。
- LUXとNOXのデータは、同じアカウントでも別々に保存される。
- 会話・記憶・興味・目標・対応する写真をFirestoreに同期する。オフラインでは端末に保存する。
- 名前は大文字小文字を区別しない。内部的にFirebaseメール/パスワード認証のIDへ変換するが、ユーザーのメールアドレスは要求しない。

## 注意
- **パスワードを忘れた場合のメール再設定はできない。** 実際のメールアドレスを登録しない設計のため。パスワードを安全に保管すること。
- 本人以外が読めないようFirestoreセキュリティルールの設定が必須。
- 初回ログインの既存履歴引き継ぎ・同時編集はバックアップを取りながら利用すること。
- 既存NEXACRAFTアカウントとアカウント情報を共有するものではない。ログイン画面の形式を合わせたもの。
- Firebaseの接続設定とFirestoreルールの公開はサイト管理者が行う必要がある。コードの反映だけではクラウド同期は開始しない。

## 実装
`lux/index.html`、`lux/cloud-sync.js`、`nox/index.html`、`nox/cloud-sync.js`、`firebase/firestore.rules`
