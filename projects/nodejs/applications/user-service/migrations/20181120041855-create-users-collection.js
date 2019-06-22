module.exports = {
  async up(db) {
    await db.createCollection('users', {
      collation: {
        locale: 'en_US',
        strength: 1,
      }
    });
  },

  async down(db) {
    await db.collection('users').drop();
  }
};
