module.exports = {
  async up(db) {
    const collection = await db.createCollection('gameservers', {});
  },

  async down(db) {
    await db.collection('gameservers').drop();
  },
};
