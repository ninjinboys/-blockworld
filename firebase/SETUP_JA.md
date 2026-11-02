# LUX / NOX の Google ログインとクラウド同期

## 1. Firebase のプロジェクトを作る
1. https://console.firebase.google.com/ を開き、同じGoogleアカウントでFirebaseプロジェクトを1つ作成する（無料のSparkプランから開始可能）。
2. 「アプリを追加」→ Web（</>）でWebアプリを登録する。
3. 表示される `firebaseConfig`（apiKey、authDomain、projectId、appId）をコピーする。
4. **サービスアカウントの秘密鍵やGoogleパスワードは不要**。入力しないこと。

## 2. Googleログインを有効化
Firebase > Authentication > Sign-in method > Google を有効化する。
Firebase > Authentication > Settings > Authorized domains に必要なドメインを登録する。

- `luxai.pages.dev` （LUX）
- `nexacraft.pages.dev` （現在のNOXの試験URL）
- `noxai.pages.dev` （NOXを独立公開した場合）

※ 実際に公開するドメインのみでよい。Firebase認証用の `<project>.firebaseapp.com` は通常既定で追加される。

## 3. Firestore を有効化し、セキュリティルールを設定
Firestore Database で Standard のデフォルトデータベースを1個作る。テストモード（全員が読み書き可能）は本番で利用しない。

Firestore > Rules に、このリポジトリの `firebase/firestore.rules` の全文を貼り付けて **Publish** する。

ルールは、`users/{Google uid}/companions/lux` と `.../nox` 以下に、ログイン本人だけがアクセスできるようにしてある。

**注意:** 既存のFirestoreデータベースを別アプリで共用している場合、他アプリのルールを消してしまわないよう、ルールを統合する。初めて作る専用Firebaseプロジェクトがおすすめ。

## 4. サイトで接続
1. LUX: https://luxai.pages.dev/ に移動する。
2. 左のサイドバー最下部の「Googleでログイン」または「連携設定」を選択する。
3. Firebaseの `firebaseConfig` を貼り付けて「保存して接続」する。
4. 再読み込み後「Googleでログイン」を押す。
5. NOX: https://nexacraft.pages.dev/nox/ （または公開後のNOXドメイン）でも **同じfirebaseConfig** を設定してログインする。

GoogleでログインするためのFirebase設定はサイトのローカルストレージに保存する。ブラウザ・ドメインが変わると設定は再入力が必要。

## 5. データの扱い
- 各Googleアカウント内で、LUXとNOXの会話・記憶・興味・目標を分けて保存。
- チャットは1チャットにつき1Firestoreドキュメント。
- 写真はサイズ制限のため必要に応じて複数のFirestoreドキュメントに分割して保存し、別の端末で読み込む。
- 既存のローカル履歴は初回ログイン時にアップロードされる。別端末ですでにデータがある場合は履歴を統合。
- ログアウト後、画面上からアカウントの履歴を閉じ、同じ端末内に再ログイン用のバックアップを残す。
- 同一チャットを複数端末から同時に編集すると、最後に同期した内容が優先される場合がある。重要な会話は「記憶を書き出す」でバックアップする。
- 未設定・未ログイン時は以前の端末内保存方式で使用可能。

## 無料枠の注意
Firebaseの課金条件・無料枠は変更される可能性がある。FirestoreのStandard無料枠は公式サイトで確認する:
https://firebase.google.com/docs/firestore/quotas
画像を大量に保存する場合は、容量・書き込み回数に注意。

## 実装ファイル
- `lux/index.html` + `lux/cloud-sync.js`
- `nox/index.html` + `nox/cloud-sync.js`
- `firebase/firestore.rules`

画像認識・AI会話（Cloudflare Workers AI）と、Google認証・Firestoreクラウド同期は別のサービス。
