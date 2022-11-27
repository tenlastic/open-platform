import * as mongoose from '@tenlastic/mongoose';

export function setup(options: mongoose.ConnectionOptions) {
  return mongoose.connect(options);
}
