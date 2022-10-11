import { workflowApiV1 } from '@tenlastic/kubernetes';
import axios from 'axios';

import { version } from '../package.json';

const apiKey = process.env.API_KEY;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
const workflowName = process.env.WORKFLOW_NAME;

(async () => {
  workflowApiV1.watch(
    'dynamic',
    { fieldSelector: `metadata.name=${workflowName}` },
    async (type, workflow) => {
      console.log(`Event - ${type}: ${workflow.metadata.name}.`);

      try {
        const nodes = Object.values(workflow.status.nodes || {}).map((n: any) => ({
          ...n,
          _id: n.id,
        }));

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
