module.exports = {
  async up(db) {
    await db.createCollection('passwordresets', {
      collation: {
        locale: 'en_US',
        strength: 1,
      },
    });
  },

  async down(db) {
    await db.collection('passwordresets').drop();
  },
};
