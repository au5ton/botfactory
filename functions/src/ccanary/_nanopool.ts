import fetch from 'node-fetch'

export interface NanopoolWorker {
  uid: number;
  id: string;
  hashrate: number;
  lastShare: number;
  rating: number;
}

export async function reportedHashrate(address: string, worker: string): Promise<{ status: boolean, data?: number, error?: string }> {
  try {
    const res = await fetch(`https://api.nanopool.org/v1/eth/reportedhashrate/${address}/${worker}`);
    const data = await res.json();
    console.log(data)
    return data;
  }
  catch(err) {
    return {
      status: false,
      error: "Error"
    }
  }
}

export async function listOfWorkers(address: string): Promise<{ status: boolean, data: NanopoolWorker[] }> {
  try {
    const res = await fetch(`https://api.nanopool.org/v1/eth/workers/${address}`);
    const data = await res.json();
    return data;
  }
  catch(err) {
    return {
      status: false,
      data: [],
    }
  }
}
