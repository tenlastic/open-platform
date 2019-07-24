module.exports = {
  async up(db) {
    const collection = db.collection('refreshtokens');

    await collection.createIndex({ userId: 1 });
  },

  async down(db) {
    const collection = db.collection('refreshtokens');

    await collection.dropIndex('userId_1');
  },
};
