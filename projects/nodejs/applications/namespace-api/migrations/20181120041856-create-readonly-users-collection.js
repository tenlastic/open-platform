module.exports = {
  async up(db) {
    const collection = await db.createCollection('readonly.users', {});

    await collection.createIndex({ email: 1 });
    await collection.createIndex({ username: 1 });
  },

  async down(db) {
    await db.collection('readonly.users').drop();
  },
};
