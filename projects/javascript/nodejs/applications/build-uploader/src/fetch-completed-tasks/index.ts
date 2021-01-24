import * as requestPromiseNative from 'request-promise-native';

export async function fetchCompletedTasks(
  apiKey: string,
  buildId: string,
  host: string,
  tasks: any[],
) {
  const query = { where: { _id: { $in: tasks.map(t => t._id) } } };
  const response = await requestPromiseNative.get({
    headers: { 'X-Api-Key': apiKey },
    json: true,
    qs: { query: JSON.stringify(query) },
    url: `${host}/builds/${buildId}/tasks`,
  });

  const failedTasks = response.records.filter(r => r.failedAt);
  if (failedTasks.length > 0) {
    const _ids = failedTasks.map(ft => ft._id);
    throw new Error(`Some Build Tasks have failed: ${_ids.join(', ')}.`);
  }

  return response.records.filter(r => r.completedAt);
}
