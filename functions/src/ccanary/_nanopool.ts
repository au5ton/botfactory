import fetch from 'node-fetch'

export async function reportedHashrate(address: string, worker: string): Promise<{ status: boolean, data: number | string }> {
  try {
    const res = await fetch(`https://api.nanopool.org/v1/eth/reportedhashrate/${address}/${worker}`);
    const data = await res.json();
    return data;
  }
  finally {
    return {
      status: false,
      data: "Error"
    }
  }
}