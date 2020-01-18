module.exports = {
  async up(db) {
    const collection = await db.createCollection('releases', {});

    await collection.createIndex({ version: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('releases').drop();
  },
};
