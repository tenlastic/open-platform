import * as mongoose from 'mongoose';
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

export * from './change-stream';
export * from './discriminators';
export * from './models';

export * from './connect';
export * from './delete-all';
export * from './sync-indexes';
