import { getUsersCollection } from "$lib/mongo";

export async function get() {
  const users = await getUsersCollection();
  const u = await users.findOne({ email: 'roman@telichk.in' });
  if (!u) {
    await users.insertOne({ email: 'roman@telichk.in', oneTimeCode: '1234' });
  }
  return {};
}