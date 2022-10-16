import { V1Pod } from '@kubernetes/client-node';
import { podApiV1, workflowApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';

import { version } from '../package.json';

const apiKey = process.env.API_KEY;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
const workflowName = process.env.WORKFLOW_NAME;

const pods: { [key: string]: V1Pod } = {};

(async () => {
  podApiV1.watch(
    'dynamic',
    { labelSelector: `workflows.argoproj.io/workflow=${workflowName}` },
    async (type, pod: V1Pod) => {
      console.log(`Pod - ${type}: ${pod.metadata.name}.`);

      if (type === 'ADDED' || type === 'MODIFIED') {
        pods[pod.metadata.name] = pod;
      } else if (type === 'DELETED') {
        delete pods[pod.metadata.name];
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );

  workflowApiV1.watch(
    'dynamic',
    { fieldSelector: `metadata.name=${workflowName}` },
    async (type, workflow) => {
      console.log(`Workflow - ${type}: ${workflow.metadata.name}.`);

      try {
        const nodes = Object.values(workflow.status.nodes || {}).map((n: any) => {
          const pod = Object.values(pods).find(
            (p) => p.metadata.annotations['workflows.argoproj.io/node-id'] === n.id,
          );
          return { ...n, _id: pod?.metadata.name };
        });

        await axios({
          data: { status: { ...workflow.status, nodes, version } },
          headers: { 'X-Api-Key': apiKey },
          method: 'put',
          url: workflowEndpoint,
        });
      } catch (e) {
        console.error(e.message);
      }
    },
    (err) => {
      console.error(err?.message);
      process.exit(err ? 1 : 0);
    },
  );
})();
