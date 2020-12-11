import { expect } from 'chai';

import { BuildMock } from '../build';
import { BuildTaskMock } from './model.mock';
import { BuildTask } from './model';
import { NamespaceMock } from '../namespace';

describe('models/build-task/model', function() {
  describe(`pre('findOneAndUpdate')`, function() {
    it('properly sets namespaceId', async function() {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const result = await BuildTask.findOneAndUpdate(
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

      const result = await BuildTaskMock.create({ buildId: build._id });

      expect(result.namespaceId.toString()).to.eql(namespace._id.toString());
    });
  });
});
