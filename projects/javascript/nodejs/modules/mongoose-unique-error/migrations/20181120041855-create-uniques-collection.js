module.exports = {
  async up(db) {
    const collection = await db.createCollection('uniques');

    await collection.createIndex({ createdAt: 1 });
    await collection.createIndex({ name: 1 }, { unique: true });
    await collection.createIndex({ updatedAt: 1 });
  },

  async down(db) {
    await db.collection('uniques').drop();
  },
};
