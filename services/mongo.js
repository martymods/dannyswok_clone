const { MongoClient } = require('mongodb');

let clientPromise = null;
let cachedDb = null;

function createMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }
  return new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });
}

async function getMongoClient() {
  if (clientPromise) {
    return clientPromise;
  }
  const client = createMongoClient();
  if (!client) {
    return null;
  }
  clientPromise = client
    .connect()
    .then((connected) => connected)
    .catch((error) => {
      clientPromise = null;
      console.error('Failed to connect to MongoDB', error); // eslint-disable-line no-console
      throw error;
    });
  return clientPromise;
}

async function getDatabase() {
  const client = await getMongoClient();
  if (!client) {
    return null;
  }
  if (cachedDb) {
    return cachedDb;
  }
  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || undefined;
  const db = dbName ? client.db(dbName) : client.db();
  cachedDb = db;
  return db;
}

module.exports = {
  getMongoClient,
  getDatabase,
};
