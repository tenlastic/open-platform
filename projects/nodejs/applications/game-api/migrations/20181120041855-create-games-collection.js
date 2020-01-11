module.exports = {
  async up(db) {
    const collection = await db.createCollection('games', {});

    await collection.createIndex({ slug: 1 }, { unique: true });
    await collection.createIndex({ title: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('games').drop();
  },
};
