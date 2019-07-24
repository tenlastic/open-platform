module.exports = {
  async up(db) {
    const collection = db.collection('passwordresets');

    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ hash: 1 }, { unique: true });
  },

  async down(db) {
    const collection = db.collection('passwordresets');

    await collection.dropIndex('expiresAt_1');
    await collection.dropIndex('hash_1');
  },
};
