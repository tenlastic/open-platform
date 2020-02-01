module.exports = {
  async up(db) {
    const collection = await db.createCollection('connections');

    await collection.createIndex(
      {
        gameId: 1,
        userId: 1,
      },
      {
        partialFilterExpression: {
          $or: [{ disconnectedAt: { $exists: false } }, { disconnectedAt: null }],
          gameId: { $exists: true },
        },
        unique: true,
      },
    );
  },

  async down(db) {
    await db.collection('connections').drop();
  },
};
