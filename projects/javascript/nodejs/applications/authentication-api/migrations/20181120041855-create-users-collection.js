module.exports = {
  async up(db) {
    const collection = await db.createCollection('users');

    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex(
      { username: 1 },
      {
        collation: {
          locale: 'en_US',
          strength: 1,
        },
        unique: true,
      },
    );
  },

  async down(db) {
    await db.collection('users').drop();
  },
};
