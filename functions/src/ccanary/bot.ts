
import * as functions from 'firebase-functions'
import { Telegraf } from 'telegraf'
import { config } from '../_config'
import { isTelegramSubnet } from '../_telegramHelper'

const BOT_TOKEN = config.ccanary.bot_token
const WEBHOOK_URL = `https://${config.gcp.datacenter}-${config.gcp.project_id}.cloudfunctions.net/ccanary-hook`

if (BOT_TOKEN === undefined) {
  throw new TypeError('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(BOT_TOKEN);
bot.telegram.setWebhook(WEBHOOK_URL)

bot.command('start', (ctx) => ctx.reply(`Hello, friend!
Send me 1 message with "/register 0xYourAddress WorkerName" to get notifications.
Send me 1 message with "/deregister 0xYourAddress WorkerName" to stop notifications.`))

bot.command('register', (ctx) => {
  const [_, address, worker] = ctx.message.text.trim().split(' ')
  ctx.reply(JSON.stringify({ address, worker }));
});

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript
export const hook = functions.https.onRequest(async (request, response) => {
  //functions.logger.info("Hello logs!", request.ip, request.ips);
  if(isTelegramSubnet(request.ip)) {
    try {
      await bot.handleUpdate(request.body)
    }
    finally {
      response.status(200).end()
    }
  }
});
