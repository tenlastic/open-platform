import { priorityClassApiV1 } from '@tenlastic/kubernetes';
import { NamespaceDocument } from '@tenlastic/mongoose';

import { KubernetesNamespace } from './';

export const KubernetesNamespacePriorityClass = {
  upsert: async (namespace: NamespaceDocument) => {
    const labels = KubernetesNamespace.getLabels(namespace);
    const name = KubernetesNamespace.getName(namespace._id);

    await priorityClassApiV1.delete(name);

    return priorityClassApiV1.create({
      metadata: { labels: { ...labels }, name },
      value: 0,
    });
  },
};
