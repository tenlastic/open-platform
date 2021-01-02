import * as kubernetes from '@tenlastic/kubernetes';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const workflowId = process.env.WORKFLOW_ID;
const workflowNamespace = process.env.WORKFLOW_NAMESPACE;

export async function getLogs(pod: string) {
  const mostRecentLog = await getMostRecentLogCreatedAt(pod);

  const emitter = kubernetes.getPodLog(
    workflowNamespace,
    pod,
    'main',
    mostRecentLog ? mostRecentLog : new Date(0).toISOString(),
  );
  emitter.on('data', data => saveLogs(data, pod));
  emitter.on('error', console.error);

  return emitter;
}

export async function getMostRecentLogCreatedAt(pod: string): Promise<any> {
  const query = { sort: '-createdAt', where: { nodeId: pod, workflowId } };

  const response = await requestPromiseNative.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: `http://api.default:3000/workflows/${workflowId}/logs`,
  });

  return response.records[0] ? response.records[0].createdAt : null;
}

export async function saveLogs(data: any, pod: string) {
  console.log(data);

  try {
    await requestPromiseNative.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { ...data, nodeId: pod },
      url: `http://api.default:3000/workflows/${workflowId}/logs`,
    });
  } catch (e) {
    console.error(e);
  }
}
