module.exports = {
  async up(db) {
    const collection = await db.createCollection('files', {});

    await collection.createIndex({ path: 1, platform: 1, releaseId: 1 }, { unique: true });
  },

  async down(db) {
    await db.collection('files').drop();
  },
};
