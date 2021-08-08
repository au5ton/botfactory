import { firebase } from '../_firebaseHelper'
import { reportedHashrate } from './_nanopool'

export interface CCanaryEntry {
  address: string;
  worker: string;
  telegram_id: number;
  previouslyActive: boolean;
}

type Ref = FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>

export async function create(address: string, worker: string, telegram_id: number) {
  const db = firebase.firestore();

  const data: CCanaryEntry = {
    address,
    worker,
    telegram_id,
    previouslyActive: (await reportedHashrate(address, worker)).status
  }

  await db.collection('ccanary').doc().create(data);
  return data;
}

export async function get(address: string, worker: string, telegram_id: number): Promise<{ found: boolean, data?: CCanaryEntry, doc?: string, ref?: Ref }> {
  const db = firebase.firestore();
  const query = db.collection('ccanary')
    .where('address','==',address)
    .where('worker','==',worker)
    .where('telegram_id','==',telegram_id);
  const snap = await query.get();
  if(snap.empty) {
    return {
      found: false
    }
  }
  else {
    return {
      found: true,
      data: snap.docs[0].data() as CCanaryEntry,
      doc: snap.docs[0].ref.path,
      ref: snap.docs[0].ref,
    }
  }
}

export async function remove(address: string, worker: string, telegram_id: number): Promise<void> {
  const db = firebase.firestore()
  const res = await get(address, worker, telegram_id)
  if(res.found) {
    await db.doc(res.doc!).delete()
  }
}

export async function getAll(): Promise<(CCanaryEntry & { ref: Ref })[]> {
  const db = firebase.firestore()
  const snap = await db.collection('ccanary').get()
  return snap.docs.map(e => ({
    ref: e.ref,
    ...e.data() as CCanaryEntry
  }))
}
