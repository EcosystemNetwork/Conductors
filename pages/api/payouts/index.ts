import type { NextApiRequest, NextApiResponse } from 'next';
import { dataStore } from '../../../lib/dataStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const payouts = await dataStore.getAllPayouts();
  return res.status(200).json({ payouts });
}
