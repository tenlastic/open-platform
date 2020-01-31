module.exports = {
  async up(db) {
    const collection = await db.createCollection('messages', {});
  },

  async down(db) {
    await db.collection('messages').drop();
  },
};
