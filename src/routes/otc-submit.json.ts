import { getUsersCollection } from "$lib/mongo";

export async function post({ body = {} }) {
  const { email, otc } = body;
  // Check that this email has active this otc
  const users = await getUsersCollection();
  const u = await users.findOne({ email: 'roman@telichk.in' });
  if (!u) {
    await users.insertOne({ email: 'roman@telichk.in', oneTimeCode: '1234' });
  }
  return {};
}