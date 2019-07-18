module.exports = {
  async up(db) {
    await db.createCollection('passwords', {
      collation: {
        locale: 'en_US',
        strength: 1,
      }
    });
  },

  async down(db) {
    await db.collection('passwords').drop();
  }
};
