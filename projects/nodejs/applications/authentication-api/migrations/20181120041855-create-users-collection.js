module.exports = {
  async up(db) {
    const collection = await db.createCollection('users', {
      collation: {
        locale: 'en_US',
        strength: 1,
      },
    });

    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ username: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('users').drop();
  },
};
