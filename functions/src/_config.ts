import * as functions from 'firebase-functions'

export const config = {
  ccanary: {
    bot_token: functions.config().ccanary.bot_token,
  },
  gcp: {
    project_id: functions.config().gcp.project_id,
    datacenter: functions.config().gcp.datacenter,
  }
}
