module.exports = {
  async up(db) {
    const collection = await db.createCollection('ignorations', {});

    await collection.createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('ignorations').drop();
  },
};
