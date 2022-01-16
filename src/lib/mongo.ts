import { MongoClient } from "mongodb";

const url = `mongodb+srv://figma-toc:${import.meta.env.VITE_MONGO_PWD}@cluster0.esu7o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(url);

let connected = false;
async function connect() {
  if (!connected) {
    await client.connect();
  }
}

export async function getDb() {
  await connect();
  return client.db('main');
}
