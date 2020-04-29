module.exports = {
  async up(db) {
    const collection = await db.createCollection('passwordresets');

    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ hash: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('passwordresets').drop();
  },
};
