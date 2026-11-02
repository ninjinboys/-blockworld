# LUX / NOX：Googleログインと端末間同期の初期設定

LUXとNOXにはGoogleログイン・Firestore同期のプログラムが実装されています。実際に動かすには、オーナーがFirebaseプロジェクトを1つ設定する必要があります。

## 1. Firebaseプロジェクト（1つだけ）を作成

1. https://console.firebase.google.com/ を開き、「プロジェクトを作成」。
2. 料金プランはまず Spark（無料枠）にする。現時点では有料プランへ変更しない。
3. プロジェクト設定（歯車）→「マイアプリ」で **ウェブアプリ** を1つ登録。LUXとNOXで同じFirebaseプロジェクトを使用する。
4. 表示される `firebaseConfig` のうち `apiKey`, `authDomain`, `projectId`, `appId`, `messagingSenderId` を控える。これはウェブ用の公開設定情報。サービスアカウントの秘密鍵やパスワードは絶対に入力・共有しない。

## 2. Googleログインを有効にする

1. Firebase → Authentication → Sign-in method → Google → 有効にする。
2. Authentication → Settings → Authorized domains（承認済みドメイン）へ、実際に使うドメインを追加する。
   - `luxai.pages.dev`
   - `nexacraft.pages.dev`（NOXの現在のURL `/nox/`）
   - NOXを別Pagesプロジェクトにした場合は `noxai.pages.dev`（実際のドメイン名に合わせる）
3. Safari等でポップアップが出ないときは、ブラウザのポップアップブロック設定を確認する。

## 3. Firestore を有効にしてルールを設定

1. Firebase → Firestore Database → データベースを作成（Standard / デフォルトのデータベース）。
2. セキュリティルール（Rules）に、リポジトリ内 `firebase/firestore.rules` の**全文**を貼り付け、「公開」を押す。
3. 「テストモードで全員読み書き可能」のルールを公開環境で使わない。
4. ログインした本人だけが `users/{uid}/agents/lux` と `users/{uid}/agents/nox` の自分のデータを読める仕組み。LUXとNOXは別々に保存する。

## 4. ウェブ側に公開設定を反映する

次の2つのファイルに**同じ** `firebaseConfig` 値を入れる：

- `lux/firebase-config.js`
- `nox/firebase-config.js`

```js
window.AGENTS_FIREBASE_CONFIG = {
  apiKey: "FirebaseのAPIキー",
  authDomain: "Firebaseの認証ドメイン（xxxx.firebaseapp.com）",
  projectId: "FirebaseのプロジェクトID",
  appId: "FirebaseのウェブアプリID",
  messagingSenderId: "メッセージ送信者ID"
};
```

GitHubにコミットするとCloudflare Pagesが自動再デプロイされる。
**まだ値を入力していない状態では「Google同期の初期設定が必要」と表示され、ログインは動かない。**

## 5. 動作確認

1. LUXの左サイドバー下部から「Googleでログイン」。画面に「同期済み」と出るまで待つ。
2. NOXでも**同じGoogleアカウント**でログイン。LUXとNOXで別の履歴になっていることを確認。
3. 端末AでLUXにメッセージを送り、端末Bで同じアカウントにログインして履歴が表示されるか確認。
4. NOXでも同様に確認。写真のクラウド保存には複数のFirestoreドキュメントを使うため、画像データが多いと同期まで時間がかかる。
5. 初回ログイン時、未ログインの会話や記憶をクラウドへ追加するか聞かれた場合は必要なときだけ許可する。匿名の元データはその端末内に保持する。
6. データを完全に消す前には「記憶を書き出す」でバックアップを保存する。

## 仕様と制限

- 無料枠の範囲で始められるが、Firestoreの利用量制限（保存容量、読み取り・書き込み回数）がある。料金・枠はFirebase公式ページで都度確認する。
- Googleログインに使うFirebase設定はCloudflare Workers AIの `AI` バインディングとは**別**。既存のAI会話用バインディングも維持する。
- セキュリティルールはFirebase側に**手動で公開**する。GitHubへルールファイルを置いただけでは適用されない。
- チャットは1チャットにつき1ドキュメントとして保存。Firestoreの1ドキュメント上限は1MiBで、極端に長い会話や多数の画像では同期できない場合がある。
- 写真は分割して保存する。Firebase Storageを使わない。
- 端末間で同時に同じチャットを編集した場合、更新順や接続状況によって競合が起こる可能性がある。重要な会話はバックアップ推奨。
- 端末間同期の完全なE2Eテストは、実際のFirebase設定が有効になるまで行えない。

公式情報:
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/quotas
