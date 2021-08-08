const fetch = require('node-fetch');
const path = require('path')
const { snooze } = require('@au5ton/snooze')
const ROOT = x => path.join(__dirname, '..', x,)
const config = require(ROOT('.runtimeconfig.json'));

(async function() {    
  // try and pressure a webhook set
  //const nap = 10000;
  //console.log(`Snoozing ${nap/1000} seconds before attempting to pressure a webhook set... 💤💤`);
  //await snooze(nap);
  console.log('\tHooking! 📣📣')
  await fetch(`https://${config.gcp.datacenter}-${config.gcp.project_id}.cloudfunctions.net/ccanary-setHook`)
})();