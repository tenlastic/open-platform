import * as mongoose from 'mongoose';
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

export * from './change-stream';
export * as errors from './errors';
export * from './json-schema';
export * from './validators';

export * from './connect';
