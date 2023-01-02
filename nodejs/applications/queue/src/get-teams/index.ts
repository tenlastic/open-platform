import { QueueModel, QueueMemberModel } from '@tenlastic/http';

import { getTeamsBreadthFirst } from '../get-teams-breadth-first';
import { getTeamsDepthFirst } from '../get-teams-depth-first';

/**
 * Matches Queue Members by filling teams first.
 */
export function getTeams(queue: QueueModel, queueMembers: QueueMemberModel[]) {
  return getTeamsBreadthFirst(queue, queueMembers) ?? getTeamsDepthFirst(queue, queueMembers);
}
