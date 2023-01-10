import * as mongoose from 'mongoose';

export const KubernetesNamespace = {
  getName: (namespaceId: mongoose.Types.ObjectId | string) => {
    return `namespace-${namespaceId}`;
  },
  isDevelopment: process.env.PWD?.includes('/usr/src/nodejs/'),
};
