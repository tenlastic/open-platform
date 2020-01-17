module.exports = {
  async up(db) {
    const collection = await db.createCollection('namespaces', {});

    await collection.createIndex({ name: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('namespaces').drop();
  },
};
