module.exports = {
  async up(db) {
    const collection = db.collection('users');

    await collection.createIndex({ userId: 1 }, { unique: true });
  },

  async down(db) {
    const collection = db.collection('users');

    await collection.dropIndex('userId_1');
  },
};
