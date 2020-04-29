module.exports = {
  async up(db) {
    const collection = await db.createCollection('collections', {});

    await collection.createIndex({ databaseId: 1, name: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('collections').drop();
  },
};
