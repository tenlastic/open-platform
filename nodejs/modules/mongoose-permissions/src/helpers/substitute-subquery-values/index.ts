import { Connection } from 'mongoose';

export interface SubqueryOptions {
  isOne?: boolean;
  model: string;
  select: string | string[];
  where: any;
}

/**
 * Substitute { $query } subdocuments within JSON with subquery results.
 */
export async function substituteSubqueryValues(mongoose: Connection, object: any) {
  if (object && object.constructor === Object) {
    const copy = {};
    const keys = Object.keys(object);

    for (const key of keys) {
      if (key === '$query') {
        return executeQuery(mongoose, object.$query);
      } else {
        copy[key] = await substituteSubqueryValues(mongoose, object[key]);
      }
    }

    return copy;
  } else if (object && object.constructor === Array) {
    const promises = object.map(q => substituteSubqueryValues(mongoose, q));
    return Promise.all(promises);
  } else {
    return object;
  }
}

async function executeQuery(mongoose: Connection, options: SubqueryOptions) {
  if (!options.model || !mongoose.modelNames().includes(options.model)) {
    throw new Error('Model not found.');
  }

  const Model = mongoose.model(options.model) as any;
  const where = await substituteSubqueryValues(mongoose, options.where);

  let query = Model.find(where);

  if (options.select) {
    const select = Array.isArray(options.select) ? options.select : options.select.split(' ');
    query = query.select(select);
  }

  let results = await query.exec();

  if (options.select) {
    const select = Array.isArray(options.select) ? options.select : options.select.split(' ');

    if (select.length === 1) {
      const property = select[0];
      results = results.map(r => r[property]);
    }
  }

  return options.isOne ? results[0] : results;
}
