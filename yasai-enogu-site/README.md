# 野菜絵の具 ／ ベジタブルファースト

東京造形大学のチーム「ベジタブルファースト」による、規格外野菜から作る「野菜絵の具」のプロジェクトサイトです。

## 見かた

`index.html` をブラウザで開くと表示されます。トップの大きなボタンから各ページ（project.html など）へ移動します。
1ページにまとめた以前の版は `onepage.html` です。

## お知らせ・活動記録の更新方法（GitHubのブラウザ画面だけでできます）

### お知らせを追加する

1. GitHub で `yasai-enogu-site/data/news.js` を開き、右上の鉛筆マーク（Edit）を押す
2. `window.NEWS = [` のすぐ下に、次のかたまりをコピーして書き足す（いちばん上が最新）

   ```js
     {
       date: "2026.12.01",
       tag: "イベント",
       title: "〇〇でワークショップを開催します。",
       link: ""
     },
   ```

3. 右上の「Commit changes」を押す → 1〜2分でサイトに反映されます

- `link` は押したときに開くページです。活動記録の項目なら `"activity.html#halloween"`、Xの投稿なら投稿のURLを入れます。なければ `""` のまま。
- トップには上から8件まで表示されます。

### 活動記録を追加する

1. 写真をアップロードする：`yasai-enogu-site/images/` を開き、「Add file」→「Upload files」で写真を入れて Commit
   - ファイル名は半角英数字にする（例 `xmas-1.jpg`）。大きすぎる写真は 1600px くらいに縮めておくと表示が速くなります
2. `yasai-enogu-site/data/activity.js` を開き、鉛筆マーク（Edit）を押す
3. `window.ACTIVITIES = [` のすぐ下に、次のかたまりをコピーして書き足す（いちばん上が最新）

   ```js
     {
       id: "xmas",
       title: "クリスマスマーケット",
       date: "2026.12.20",
       label: "〇〇広場",
       text: "本文です。[[ここはオレンジで強調]]されます。\n改行もできます。",
       photos: [
         { src: "images/xmas-1.jpg", alt: "会場の様子" },
         { src: "images/xmas-2.jpg", alt: "作品", tall: true },
       ]
     },
   ```

4. 「Commit changes」を押す

- 写真は3枚ずつ1段に並びます。縦長の写真には `tall: true` を付けます。
- 野菜キャラクターは自動で配置されます。
- 書き間違えて表示が消えたときは、コンマ `,` や `"` の付け忘れがないか確認してください。GitHub の「History」から前の状態に戻すこともできます。

## フォルダ構成

- `index.html` ほか各ページ … サイト本体（`onepage.html` は1ページ版）
- `data/news.js` … お知らせの中身
- `data/activity.js` … 活動記録の中身
- `css/style.css` … 全体のデザイン
- `css/veg-peek.css`, `js/veg-peek.js` … スクロールで野菜が画面の端から顔を出す演出
- `js/main.js` … メニュー、トップのイラストの動き、写真の表示アニメーション
- `js/content.js` … お知らせ・活動記録を data から表示する
- `images/` … 写真・イラスト（`images/hero/` はトップのイラストのパーツ、`images/veg/` は野菜キャラクターの表情）
