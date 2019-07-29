module.exports = {
  async up(db) {
    const collection = await db.createCollection('databases', {});

    await collection.createIndex({ name: 1, userId: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('databases').drop();
  },
};
