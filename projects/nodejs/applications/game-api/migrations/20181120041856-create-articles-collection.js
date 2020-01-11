module.exports = {
  async up(db) {
    const collection = await db.createCollection('articles', {});
  },

  async down(db) {
    await db.collection('articles').drop();
  },
};
