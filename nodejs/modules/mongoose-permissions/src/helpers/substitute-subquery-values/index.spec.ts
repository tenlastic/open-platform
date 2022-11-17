import { expect } from 'chai';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { substituteSubqueryValues } from './';

const chance = new Chance();

const schema = new mongoose.Schema({ name: String, parentId: mongoose.Schema.Types.ObjectId });
const Model = mongoose.model('substitute-subquery-values', schema);

describe('substitute-subquery-values', function () {
  beforeEach(async function () {
    await Model.deleteMany();
  });

  it('executes multiple queries', async function () {
    const parentOfParent = await Model.create({ name: chance.hash() });
    const parent = await Model.create({ name: chance.hash(), parentId: parentOfParent._id });
    await Model.create({ parentId: parent._id });

    const query = {
      $and: [
        {
          parentId: {
            $in: {
              $query: {
                model: Model.modelName,
                select: '_id',
                where: {
                  parentId: {
                    $query: {
                      isOne: true,
                      model: Model.modelName,
                      select: '_id',
                      where: {
                        name: parentOfParent.name,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    };

    const result = await substituteSubqueryValues(mongoose.connection, query);

    expect(result).to.eql({ $and: [{ parentId: { $in: [parent._id] } }] });
  });
});
