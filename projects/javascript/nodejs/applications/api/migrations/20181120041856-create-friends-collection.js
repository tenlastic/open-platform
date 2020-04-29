module.exports = {
  async up(db) {
    const collection = await db.createCollection('friends', {});

    await collection.createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('friends').drop();
  },
};
