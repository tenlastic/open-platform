import * as mongoose from '@tenlastic/mongoose-models';

export function connect(options: mongoose.ConnectionOptions) {
  return mongoose.connect(options);
}
