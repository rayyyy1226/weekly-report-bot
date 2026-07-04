require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== フォーラムID =====
const FORUM_CHANNEL_ID = '1522824733236658337';

// ===== テスト切替 =====
// true = 毎分実行（テスト）
// false = 水曜20時
const TEST_MODE = true;

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

    // ⚠️ ここ重要：Googleの標準認証形式
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      date: new Date().toISOString(),
      title: title,
    });

    console.log('📊 Sheets記録成功');
  } catch (err) {
    console.error('❌ Sheetsエラー:', err);
  }
}

// ===== 起動 =====
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

        console.log('🟢 フォーラム投稿成功');

        await logToSheet(title);

      } catch (err) {
        console.error('❌ 投稿エラー:', err);
      }
    },
    {
      timezone: 'Asia/Tokyo'
    }
  );

  console.log(TEST_MODE ? '🧪 テストモード（毎分実行）' : '📅 本番モード（水曜20時）');
});

client.login(process.env.DISCORD_TOKEN);