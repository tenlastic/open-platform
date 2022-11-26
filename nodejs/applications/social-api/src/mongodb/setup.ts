import * as mongooseModels from '@tenlastic/mongoose-models';

export function setup(options: mongooseModels.ConnectionOptions) {
  return mongooseModels.connect(options);
}
