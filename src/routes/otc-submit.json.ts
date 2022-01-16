import uuid from 'uuid';
import { getDb } from '$lib/mongo';

export async function post({ body }) {
  const { email, otc, otcId } = body || {};
  if (!email || !otc || !otcId) return {};

  const db = await getDb();

  const user = await db.collection('users').findOne({ email });
  if (!user) return { status: 400 };
  
  const code = user.codes.find(c => c.id === otcId && c.code === otc);
  if (!code) return { status: 400 };

  const token = uuid.v4();
  await db.collection('users').updateOne({ email }, {
    $push: {
      tokens: token,
    }
  });
  return {
    status: 200,
    body: { token },
  };
}