module.exports = {
  async up(db) {
    await db.createCollection('refreshtokens');
  },

  async down(db) {
    await db.collection('refreshtokens').drop();
  },
};
