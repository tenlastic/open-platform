module.exports = {
  async up(db) {
    const collection = db.collection('passwordresets');

    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
    await collection.createIndex({ hash: 1 });
  },

  async down(db) {
    const collection = db.collection('passwordresets');

    await collection.dropIndex('createdAt_1');
    await collection.dropIndex('hash_1');
  },
};
