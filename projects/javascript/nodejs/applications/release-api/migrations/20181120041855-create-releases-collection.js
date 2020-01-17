module.exports = {
  async up(db) {
    const collection = await db.createCollection('releases', {});
  },

  async down(db) {
    await db.collection('releases').drop();
  },
};
