import { ObjectId } from "mongodb";

function configCollection(db) {
  return db.collection("config");
}

export async function createConfig(db, session, doc) {
  const result = await configCollection(db).insertOne(
    {
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listConfigs(db, session) {
  return configCollection(db)
    .find({}, { session })
    .sort({ key: 1 })
    .toArray();
}

export async function getConfigByKey(db, session, key) {
  return configCollection(db).findOne({ key }, { session });
}

export async function getConfigById(db, session, configId) {
  return configCollection(db).findOne({ _id: new ObjectId(configId) }, { session });
}

export async function updateConfig(db, session, configId, updates) {
  const filter = { _id: new ObjectId(configId) };
  const update = {
    $set: {
      ...updates,
      updatedAt: new Date()
    }
  };
  const result = await configCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return configCollection(db).findOne(filter, { session });
}

export async function deleteConfig(db, session, configId) {
  const result = await configCollection(db).deleteOne({ _id: new ObjectId(configId) }, { session });
  return result.deletedCount > 0;
}
