require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;

// テスト用（true = 毎分 / false = 水曜20時）
const TEST_MODE = true;

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

// ===== Sheets（修正版） =====
async function logToSheet(title) {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.SHEET_ID, auth);

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      date: new Date().toISOString(),
      title: title,
    });

    console.log('Sheets OK');
  } catch (err) {
    console.error('Sheets error:', err);
  }
}

// ===== 起動 =====
client.once('ready', () => {
  console.log(`ログイン成功: ${client.user.tag}`);

  const schedule = TEST_MODE ? '* * * * *' : '0 20 * * 3';

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

      console.log('Posted');

      await logToSheet(title);

    } catch (err) {
      console.error('Error:', err);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });

  console.log(TEST_MODE ? 'TEST MODE（毎分）' : 'PROD MODE');
});

client.login(process.env.DISCORD_TOKEN);