import * as kubernetes from '@tenlastic/kubernetes';
import { EventEmitter } from 'events';
import * as requestPromiseNative from 'request-promise-native';

const accessToken = process.env.ACCESS_TOKEN;
const workflowEndpoint = process.env.WORKFLOW_ENDPOINT;
const workflowNamespace = process.env.WORKFLOW_NAMESPACE;

export async function getLogs(pod: string): Promise<EventEmitter> {
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
  const query = { sort: '-createdAt', where: { nodeId: pod } };

  const response = await requestPromiseNative.get({
    headers: { Authorization: `Bearer ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: `${workflowEndpoint}/logs`,
  });

  return response.records[0] ? response.records[0].createdAt : null;
}

export async function saveLogs(data: any, pod: string) {
  try {
    await requestPromiseNative.post({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: { ...data, nodeId: pod },
      url: `${workflowEndpoint}/logs`,
    });
  } catch (e) {
    console.error(e);
  }
}
