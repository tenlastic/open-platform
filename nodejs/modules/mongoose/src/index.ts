import { mongoose } from '@typegoose/typegoose';

mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);
mongoose.set('toJSON', { flattenMaps: true });
mongoose.set('toObject', { flattenMaps: true });

export * from './json-schema';
export * from './models';
export * from './permissions';
export * from './plugins';
export * from './validators';

export * from './connect';
export * from './enable-pre-post-images';
export * from './status';
export * from './sync-indexes';
