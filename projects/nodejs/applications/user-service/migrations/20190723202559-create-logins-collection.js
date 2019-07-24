module.exports = {
  async up(db) {
    await db.createCollection('logins');
  },

  async down(db) {
    await db.collection('logins').drop();
  },
};
