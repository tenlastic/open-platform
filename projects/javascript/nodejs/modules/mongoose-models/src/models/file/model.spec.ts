import { expect } from 'chai';

import { BuildMock } from '../build';
import { NamespaceMock } from '../namespace';
import { FileMock } from './model.mock';
import { File } from './model';

describe('models/file/model', function() {
  describe(`pre('findOneAndUpdate')`, function() {
    it('properly sets namespaceId', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const result = await File.findOneAndUpdate(
        { buildId: build._id },
        { buildId: build._id },
        { new: true, upsert: true },
      );

      expect(result.namespaceId.toString()).to.eql(namespace._id.toString());
    });
  });

  describe(`pre('save')`, function() {
    it('properly sets namespaceId', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const result = await FileMock.create({ buildId: build._id });

      expect(result.namespaceId.toString()).to.eql(namespace._id.toString());
    });
  });
});
