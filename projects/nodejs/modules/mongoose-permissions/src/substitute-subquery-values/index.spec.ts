import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { Example } from '../example-model';
import { substituteSubqueryValues } from './';

describe('substitute-subquery-values', function() {
  it('executes multiple queries', async function() {
    const parentOfParent = await Example.mock();
    const parent = await Example.mock({ parentId: parentOfParent._id });
    const record = await Example.mock({ parentId: parent._id });

    const query = {
      $and: [
        {
          parentId: {
            $in: {
              $query: {
                model: 'ExampleSchema',
                select: '_id',
                where: {
                  parentId: {
                    $query: {
                      isOne: true,
                      model: 'ExampleSchema',
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
