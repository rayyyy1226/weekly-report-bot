require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== 設定 =====
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;

// ★本番はfalse固定
const TEST_MODE = false;

// ===== テンプレ =====
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

// ===== Google Sheets（修正版） =====
async function logToSheet(title) {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    // ★新しい認証方式
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await doc.useAuth(serviceAccountAuth);

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      date: new Date().toISOString(),
      title,
    });

    console.log('Sheets OK');
  } catch (err) {
    console.error('Sheets error:', err);
  }
}

// ===== 起動 =====
client.once('ready', () => {
  console.log(`ログイン成功: ${client.user.tag}`);

  // ★週1固定（水曜20時）
  const schedule = '0 20 * * 3';

  cron.schedule(schedule, async () => {
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

      await logToSheet(title);

    } catch (err) {
      console.error('投稿エラー:', err);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });

  console.log('本番モード：毎週水曜20時実行');
});

client.login(process.env.DISCORD_TOKEN);