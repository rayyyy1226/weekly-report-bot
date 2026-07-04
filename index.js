require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

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

  const f = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  return `${f(start)}〜${f(end)} 週次進捗`;
}

client.once('ready', async () => {
  console.log('ログイン成功:', client.user.tag);

  try {
    const channel = await client.channels.fetch(FORUM_CHANNEL_ID);

    await channel.threads.create({
      name: getWeekRange(),
      message: {
        content: `@everyone\n\n${TEMPLATE}`
      }
    });

    console.log('投稿成功');
  } catch (e) {
    console.error(e);
  }

  process.exit(0); // ←超重要（Actions用）
});

client.login(DISCORD_TOKEN);