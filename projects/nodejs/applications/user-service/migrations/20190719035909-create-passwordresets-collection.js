module.exports = {
  async up(db) {
    await db.createCollection('passwordresets');
  },

  async down(db) {
    await db.collection('passwordresets').drop();
  },
};
