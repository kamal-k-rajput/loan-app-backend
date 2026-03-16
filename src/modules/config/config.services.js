import {
  createConfig,
  listConfigs,
  getConfigByKey,
  getConfigById,
  updateConfig,
  deleteConfig
} from "./config.repositories.js";

export async function createConfigService(db, session, payload) {
  // Check if config with same key already exists
  const existing = await getConfigByKey(db, session, payload.key);
  if (existing) {
    throw new Error("CONFIG_KEY_ALREADY_EXISTS");
  }

  const config = await createConfig(db, session, payload);
  return {
    ...config,
    id: config._id.toString()
  };
}

export async function listConfigsService(db, session) {
  const configs = await listConfigs(db, session);
  return configs.map((c) => ({
    ...c,
    id: c._id.toString()
  }));
}

export async function getConfigService(db, session, configId) {
  const config = await getConfigById(db, session, configId);
  if (!config) return null;
  return {
    ...config,
    id: config._id.toString()
  };
}

export async function updateConfigService(db, session, configId, updates) {
  const config = await updateConfig(db, session, configId, updates);
  if (!config) return null;
  return {
    ...config,
    id: config._id.toString()
  };
}

export async function deleteConfigService(db, session, configId) {
  return deleteConfig(db, session, configId);
}
