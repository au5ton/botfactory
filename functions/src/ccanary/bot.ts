
import * as functions from 'firebase-functions'
import { Telegraf } from 'telegraf'
import { config } from '../_config'

const BOT_TOKEN = config.ccanary.bot_token
const WEBHOOK_URL = `https://${config.gcp.datacenter}-${config.gcp.project_id}.cloudfunctions.net/ccanary-hook`

if (BOT_TOKEN === undefined) {
  throw new TypeError('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(BOT_TOKEN);
bot.telegram.setWebhook(WEBHOOK_URL)

bot.command('hello', (ctx) => ctx.reply('Hello, friend!'));

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const hook = functions.https.onRequest(async (request, response) => {
  functions.logger.info("Hello logs!", request.ip, request.ips);
  //response.send("Hello from Firebase!");

  try {
    await bot.handleUpdate(request.body)
  }
  finally {
    response.status(200).end()
  }

});
