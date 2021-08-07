import { firebase } from '../_firebaseHelper'
import { reportedHashrate } from './_nanopool'

export interface MonitorEntry {
  address: string;
  worker: string;
  lastStatus: boolean;
}

export async function create(address: string, worker: string) {
  const db = firebase.firestore();

  const data: MonitorEntry = {
    address,
    worker,
    lastStatus: (await reportedHashrate(address, worker)).status
  }

  await db.collection('ccanary').doc().create(data);
  return data;
}

export async function get(address: string, worker: string): Promise<{ found: boolean, data?: MonitorEntry }> {
  const db = firebase.firestore();
  const query = db.collection('ccanary').where('address','==',address).where('worker','==',worker)
  const snap = await query.get();
  if(snap.empty) {
    return {
      found: false
    }
  }
  else {
    return {
      found: true,
      data: snap.docs[0].data() as MonitorEntry
    }
  }
}
