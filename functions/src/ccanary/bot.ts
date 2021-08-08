
import * as functions from 'firebase-functions'
import { Telegraf } from 'telegraf'
import { config, DEBUGGING } from '../_config'
import { isTelegramSubnet } from '../_telegramHelper'
import * as nanopool from './_nanopool'
import * as database from './_database'

const BOT_TOKEN = config.ccanary.bot_token
const WEBHOOK_URL = `https://${config.gcp.datacenter}-${config.gcp.project_id}.cloudfunctions.net/ccanary-hook`

if (BOT_TOKEN === undefined) {
  throw new TypeError('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(BOT_TOKEN);
if(DEBUGGING) {
  (async () => {
    const tunnel = require('../_localtunnel')
    if(! tunnel.locked()) {
      console.warn('⚡ Debugging mode enabled! Creating localtunnel.')
      const tun = await tunnel.initialize()
      const DEBUG_HOOK = `${tun.url}/${config.gcp.project_id}/${config.gcp.datacenter}/ccanary-hook`
      console.warn(`⚡ Local tunnel created at: ${DEBUG_HOOK}`)
      bot.telegram.setWebhook(DEBUG_HOOK)
    }
    else {
      console.warn('⚡ Tunnel already locked')
    }
  })();
}
else {
  bot.telegram.setWebhook(WEBHOOK_URL)
}

bot.command('start', (ctx) => ctx.reply(`Hello, friend!
Send me 1 message with "/register 0xYourAddress WorkerName" to get notifications.
Send me 1 message with "/deregister 0xYourAddress WorkerName" to stop notifications.`))

bot.command('env', ctx => ctx.reply(`debugging? ${DEBUGGING}`))

bot.command('register', async (ctx) => {
  const [_, address, worker] = ctx.message.text.trim().split(' ')
  const telegram_id = ctx.from.id;
  
  // check if we're already registered for notifications
  if(! (await database.get(address, worker, telegram_id)).found) {
    // check if address/worker pair exists on the Nanopool API
    const workers = await nanopool.listOfWorkers(address);
    if(workers.status && Array.isArray(workers.data) && workers.data.findIndex(e => e.id === worker) >= 0) {
      const entry = await database.create(address, worker, telegram_id);
      ctx.reply(`You've been registered for notifications for that address ✅`)
      if(! entry.previouslyActive) {
        ctx.reply(`That worker is offline right now. The first notification you get for it will be after it comes back online, then to go offline again.`)
      }
    }
    else {
      ctx.reply(`That address/worker pair could not be found on Nanopool`)
    }
  }
  else {
    ctx.reply(`You're already registered for notifications on that address/worker!`)
  }
});

bot.command('deregister', async (ctx) => {
  const [_, address, worker] = ctx.message.text.trim().split(' ')
  const telegram_id = ctx.from.id;
  
  // check if we're already registered for notifications
  if((await database.get(address, worker, telegram_id)).found) {
    await database.remove(address, worker, telegram_id)
    ctx.reply(`You've been deregistered from notifications for that address/worker ❌`)
  }
  else {
    ctx.reply(`You're not yet registered for notifications for that address/worker!`)
  }
});

// The actual webhook
export const hook = functions.https.onRequest(async (request, response) => {
  try {
    if(isTelegramSubnet(request.ip)) {
      await bot.handleUpdate(request.body)
    }
  }
  finally {
    return response.status(200).end()
  }
});

// for setting the webhook back to production
export const setHook = functions.https.onRequest(async (request, response) => {
  try {
    await bot.telegram.setWebhook(WEBHOOK_URL)
  }
  finally {
    return response.status(200).end()
  }
})

async function checkAlive() {
  try {
    const subs = await database.getAll();
    for(const { address, worker, telegram_id, previouslyActive, ref } of subs) {
      try {
        // we need to get this
        const res = await nanopool.reportedHashrate(address, worker)
        const exists = res.status && res.error === undefined && res.data
        const wasDeleted = (!exists) || res.error === 'No data found'
        const nowActive = exists && res.data && res.data > 0
        const nowInactive = exists && res.data && res.data === 0

        console.log('res?',res)
        console.log('exists?',exists)
        console.log('wasDeleted?', wasDeleted)
        console.log('nowActive?',nowActive)
        console.log('nowInactive?',nowInactive)

        // check if worker was deleted by Nanopool
        if(wasDeleted) {
          // delete our reference, we don't want to check anymore
          await ref.delete();
          // tell the associated user
          await bot.telegram.sendMessage(telegram_id, `❌ The worker "${worker}" (${address}) isn't listed by Nanopool and has been unregistered from notifications.`);
          // go to the next worker
          continue;
        }

        // update the state with the latest info
        await ref.update({ 'previouslyActive': nowActive })

        // send a message if the worker is currently inactive, but was active last we checked
        if(previouslyActive && nowInactive) {
          await bot.telegram.sendMessage(telegram_id, `🚩 The worker "${worker}" (${address}) is offline.`)
        }
      }
      catch(err){}
      
    }
  }
  finally {
    return
  }
}

export const checkAliveSchedule = functions.pubsub.schedule('every 10 minutes').onRun(async (ctx) => await checkAlive())

export const checkAliveNow = functions.https.onRequest(async (request, response) => {
  await checkAlive();
  return response.status(200).end();
})
