import * as minio from '@tenlastic/minio';
import { expect } from 'chai';
import * as fs from 'fs';
import { NamespaceGameLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';

import { GameMock } from './model.mock';
import { Game, GameAccess } from './model';

describe('models/game.model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the games.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          games: NamespaceGameLimitsMock.create({ count: 1 }),
        }),
      });
      await GameMock.create({ namespaceId: namespace._id });

      const promise = Game.checkNamespaceLimits(null, GameAccess.Private, namespace._id);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: games.count. Value: 1.');
    });

    it('enforces the games.public Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          games: NamespaceGameLimitsMock.create({ public: 0 }),
        }),
      });

      const promise = Game.checkNamespaceLimits(null, GameAccess.Public, namespace._id);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: games.public. Value: 0.');
    });
  });

  describe('removeMinioImages()', function() {
    it('removes unused minio images', async function() {
      const game = await GameMock.create();

      // Upload background image.
      const backgroundKey = game.getMinioKey('background');
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, backgroundKey, backgroundStream);

      // Upload image.
      const stream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, game.getMinioKey('images'), stream);

      await game.removeMinioImages();

      const objects = await minio.listObjects(process.env.MINIO_BUCKET, game.getMinioKey());
      expect(objects.length).to.eql(1);
      expect(objects[0].name).to.eql(backgroundKey);
    });
  });

  describe('removeMinioObjects()', function() {
    it('removes all minio objects', async function() {
      const game = await GameMock.create();

      // Upload background image.
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(
        process.env.MINIO_BUCKET,
        game.getMinioKey('background'),
        backgroundStream,
      );

      // Upload icon image.
      const iconStream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, game.getMinioKey('icon'), iconStream);

      await game.removeMinioObjects();

      const objects = await minio.listObjects(process.env.MINIO_BUCKET, game.getMinioKey());
      expect(objects.length).to.eql(0);
    });
  });

  describe('removeMinioVideos()', function() {
    it('removes unused minio videos', async function() {
      const game = await GameMock.create();

      // Upload background image.
      const backgroundKey = game.getMinioKey('background');
      const backgroundStream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, backgroundKey, backgroundStream);

      // Upload video.
      const stream = fs.createReadStream(__filename);
      await minio.putObject(process.env.MINIO_BUCKET, game.getMinioKey('videos'), stream);

      await game.removeMinioVideos();

      const objects = await minio.listObjects(process.env.MINIO_BUCKET, game.getMinioKey());
      expect(objects.length).to.eql(1);
      expect(objects[0].name).to.eql(backgroundKey);
    });
  });
});
