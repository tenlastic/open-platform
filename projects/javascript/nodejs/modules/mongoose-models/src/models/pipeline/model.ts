import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@hasezoey/typegoose';
import * as k8s from '@kubernetes/client-node';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { PipelineTemplateDocument } from '../pipeline-template';
import { PipelineSpecDocument } from './spec';

export const PipelineEvent = new EventEmitter<IDatabasePayload<PipelineDocument>>();

// Publish changes to Kafka.
PipelineEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Pipelines if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Pipeline.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const customObjects = kc.makeApiClient(k8s.CustomObjectsApi);

@index({ namespaceId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'pipelines',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: PipelineEvent })
@pre('remove', async function(this: PipelineDocument) {
  await this.deleteKubernetesResources();
})
@post('save', async function(this: PipelineDocument) {
  if (!this.wasNew) {
    return;
  }

  await this.createKubernetesResources();
})
export class PipelineSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true })
  public isPreemptible: boolean;

  @prop({ immutable: true, required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ immutable: true })
  public pipelineTemplateId: Ref<PipelineTemplateDocument>;

  @prop({ immutable: true, required: true })
  public spec: PipelineSpecDocument;

  @prop()
  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'pipelineTemplateId',
    ref: 'PipelineTemplateSchema',
  })
  public pipelineTemplateDocument: PipelineTemplateDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  private get kubernetesNamespace() {
    return `namespace-${this.namespaceId}`;
  }

  private get kubernetesResourceName() {
    return `pipeline-${this._id}`;
  }

  /**
   * Deletes an Argo Workflow within Kubernetes.
   */
  private async deleteKubernetesResources() {
    try {
      await customObjects.deleteNamespacedCustomObject(
        'argoproj.io',
        'v1alpha1',
        this.kubernetesNamespace,
        'workflows',
        this.kubernetesResourceName,
      );
    } catch {}
  }

  /**
   * Creates an Argo Workflow within Kubernetes if it does not exist.
   */
  private async createKubernetesResources() {
    const affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: 'cloud.google.com/gke-preemptible',
                  operator: this.isPreemptible ? 'Exists' : 'DoesNotExist',
                },
              ],
            },
          ],
        },
      },
    };

    const templates = this.spec.templates.map(t => {
      const template = t.toObject();
      template.script.volumeMounts = [{ mountPath: '/usr/src/', name: 'workspace' }];
    });

    await customObjects.createNamespacedCustomObject(
      'argoproj.io',
      'v1alpha1',
      this.kubernetesNamespace,
      'workflows',
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: {
          name: this.kubernetesResourceName,
        },
        spec: {
          activeDeadlineSeconds: 60 * 60,
          affinity,
          automountServiceAccountToken: false,
          dnsPolicy: 'Default',
          entrypoint: 'pipeline',
          podGC: {
            strategy: 'OnPodComplete',
          },
          templates: [
            {
              name: 'pipeline',
              steps: this.spec.steps.map(s => [s]),
            },
            ...templates,
          ],
          ttlStrategy: {
            secondsAfterSuccess: 60 * 60,
          },
          volumeClaimTemplates: [
            {
              metadata: { name: 'workspace' },
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: {
                  requests: {
                    storage: '10Gi',
                  },
                },
              },
            },
          ],
        },
      },
    );
  }
}

export type PipelineDocument = DocumentType<PipelineSchema>;
export type PipelineModel = ReturnModelType<typeof PipelineSchema>;
export const Pipeline = getModelForClass(PipelineSchema);
