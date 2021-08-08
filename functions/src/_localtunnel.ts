import * as fs from 'fs'
import * as path from 'path'
import * as localtunnel from 'localtunnel'

const ROOT = (x: string) => path.join(__dirname, '..', x,)

export async function initialize() {
  // start tunnel
  const tun = await localtunnel({ port: 5001 })
  // write lockfile
  fs.closeSync(fs.openSync(ROOT('.tunnel.lock'), 'w'))
  return tun
}

export const locked = () => fs.existsSync(ROOT('.tunnel.lock'))
