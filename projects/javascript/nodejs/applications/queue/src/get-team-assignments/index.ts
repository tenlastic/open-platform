export interface Queue {
  teams: number;
  usersPerTeam: number;
}

export interface QueueMember {
  userIds: string[];
}

/**
 * Matches QueueMembers together.
 */
export function getTeamAssignments(queue: Queue, queueMembers: QueueMember[]) {
  const complete: string[][] = [];
  const incomplete: string[][] = [];

  for (const queueMember of queueMembers) {
    for (let i = 0, length = incomplete.length; i < length + 1; i++) {
      incomplete[i] = incomplete[i] || [];

      // If team will be too large after adding new Users, go to next team.
      if (incomplete[i].length + queueMember.userIds.length > queue.usersPerTeam) {
        continue;
      }

      // Add Users to team.
      incomplete[i].push(...queueMember.userIds);

      // If team is complete after adding new Users, mark complete and reset.
      if (incomplete[i].length === queue.usersPerTeam) {
        complete.push(incomplete[i]);
        incomplete.splice(i);
      }

      break;
    }

    // If we have enough completed teams, stop the loop.
    if (complete.length === queue.teams) {
      break;
    }
  }

  return complete.flat();
}
