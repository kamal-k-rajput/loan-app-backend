import { MongoClient } from "mongodb";
import { MONGO_DB_NAME, MONGO_URI } from "../utils/constants.js";

let client;

export async function connectMongo(app) {
  if (!client) {
    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 20,
    });
    await client.connect();
  }

  const db = client.db(MONGO_DB_NAME);
  app.locals.mongoClient = client;
  app.locals.db = db;
}
