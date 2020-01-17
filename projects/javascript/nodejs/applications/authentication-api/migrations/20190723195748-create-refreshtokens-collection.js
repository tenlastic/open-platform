module.exports = {
  async up(db) {
    const collection = await db.createCollection('refreshtokens');

    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ jti: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
  },

  async down(db) {
    await db.collection('refreshtokens').drop();
  },
};
