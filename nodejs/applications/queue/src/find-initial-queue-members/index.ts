import dependencies from '../dependencies';

export async function findInitialQueueMembers(
  index: number,
  namespaceId: string,
  queueId: string,
  replicas: number,
  skip = 0,
) {
  const limit = 100;
  const queueMembers = await dependencies.queueMemberService.find(namespaceId, {
    limit,
    skip,
    where: { queueId, unix: { $mod: [replicas, index] } },
  });

  if (limit === queueMembers.length) {
    const additionalQueueMembers = await findInitialQueueMembers(
      index,
      namespaceId,
      queueId,
      replicas,
      limit + skip,
    );

    queueMembers.push(...additionalQueueMembers);
  }

  return queueMembers;
}
