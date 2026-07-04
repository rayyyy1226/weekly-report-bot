require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== フォーラムID =====
const FORUM_CHANNEL_ID = '1522824733236658337';

// ===== テンプレ =====
const TEMPLATE = `📌 今週の進捗報告

各自、このテンプレートをコピーして返信してください。

■ 名前
・

■ 今週の進捗
例：QUWON｜カードデザイン済・外箱デザイン中

■ 来週やること
・

■ 困っていること
・

■ 今週の一言
・
`;

// ===== 週タイトル =====
function getWeekRange() {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const f = (d) =>
    `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;

  return `${f(start)}〜${f(end)} 週次進捗`;
}

// ===== Google Sheets =====
async function logToSheet(title) {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      date: new Date().toISOString(),
      title: title
    });

    console.log('Sheets記録完了');
  } catch (err) {
    console.error('Sheetsエラー:', err);
  }
}

// ===== 起動 =====
client.once('ready', () => {
  console.log(`ログイン成功: ${client.user.tag}`);

  // 水曜20時
  cron.schedule(
    '0 20 * * 3',
    async () => {
      try {
        const channel = await client.channels.fetch(FORUM_CHANNEL_ID);

        const title = getWeekRange();

        // フォーラム投稿
        await channel.threads.create({
          name: title,
          message: {
            content: `@everyone\n\n${TEMPLATE}`
          }
        });

        console.log('フォーラム投稿成功');

        // Sheets記録
        await logToSheet(title);

      } catch (err) {
        console.error('投稿エラー:', err);
      }
    },
    {
      timezone: 'Asia/Tokyo'
    }
  );
});

client.login(process.env.DISCORD_TOKEN);