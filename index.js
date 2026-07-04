require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const express = require('express');

// ======================
// Discord Bot
// ======================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// テストモード（trueにすると毎分）
const TEST_MODE = false;

// ======================
// フォーラムテンプレ
// ======================
const TEMPLATE = `📌 今週の進捗報告

各自、このテンプレートをコピーして返信してください。

■ 名前
・

■ 今週の進捗
・

■ 来週やること
・

■ 困っていること
・

■ 今週の一言
・
`;

// ======================
// 週タイトル
// ======================
function getWeekRange() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const format = (d) =>
    `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;

  return `${format(start)}〜${format(end)} 週次進捗`;
}

// ======================
// Discord起動
// ======================
client.once('ready', () => {
  console.log(`ログイン成功: ${client.user.tag}`);

  const schedule = TEST_MODE ? '* * * * *' : '0 20 * * 3';

  cron.schedule(
    schedule,
    async () => {
      try {
        const channel = await client.channels.fetch(FORUM_CHANNEL_ID);
        const title = getWeekRange();

        await channel.threads.create({
          name: title,
          message: {
            content: `@everyone\n\n${TEMPLATE}`
          }
        });

        console.log('フォーラム投稿成功');
      } catch (err) {
        console.error('投稿エラー:', err);
      }
    },
    {
      timezone: 'Asia/Tokyo'
    }
  );

  console.log(TEST_MODE ? 'テストモード（毎分）' : '本番モード（週1）');
});

client.login(DISCORD_TOKEN);

// ======================
// Render用 HTTPサーバー（重要）
// ======================
const app = express();

app.get('/', (req, res) => {
  res.send('bot is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('HTTP server running on port', PORT);
});