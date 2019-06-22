module.exports = {
  async up(db) {
    const collection = db.collection('users');

    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ username: 1 }, { unique: true });
  },

  async down(db) {
    const collection = db.collection('users');

    await collection.dropIndex('email_1');
    await collection.dropIndex('username_1');
  }
};
