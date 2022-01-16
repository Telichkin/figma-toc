import uuid from 'uuid';
import { getDb } from '$lib/mongo';
import { random } from '$lib/utils';

export async function post({ body }) {
  const { email } = body || {};
  if (!email) return { status: 400 };

  const db = await getDb();
  const newOtc = { id: uuid.v4(), code: random(1100, 9999).toString(), ts: +(new Date()) };

  const { modifiedCount } = await db.collection('users').updateOne({ email }, {
    $push: {
      codes: newOtc,
    }
  });
  if (!modifiedCount) {
     await db.collection('users').insertOne({ 
       email, 
       codes: [newOtc],
       tokens: [],
       boards: [],
       figmaToken: '',
       figmaRefreshToken: '',
    });
  }

  // TODO: Send code to email
  return { 
    status: 200,
    body: { id: newOtc.id },
  };
}
