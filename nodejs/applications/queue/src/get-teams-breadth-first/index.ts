import { IMatch, QueueMemberModel, QueueModel } from '@tenlastic/http';

/**
 * Matches Queue Members by adding Users to the team with the least members.
 */
export function getTeamsBreadthFirst(queue: QueueModel, queueMembers: QueueMemberModel[]) {
  let createdAt: Date;
  let fullTeams: IMatch.Team[] = [];

  const teams: IMatch.Team[] = [];
  for (let i = 0; i < queue.usersPerTeam.length; i++) {
    teams[i] = { userIds: [] };
  }

  for (const queueMember of queueMembers) {
    const minimum = Math.min(...teams.map((t) => t.userIds.length));
    const index = teams.findIndex((t) => minimum === t.userIds.length);
    const team = teams[index];
    const usersPerTeam = queue.usersPerTeam[index];

    // If team will be too large after adding Users, try the next team.
    if (queueMember.userIds.length + team.userIds.length > usersPerTeam) {
      continue;
    }

    // Save createdAt to determine Queue thresholds.
    createdAt ??= queueMember.createdAt;

    // Add Users to the team.
    team.userIds.push(...queueMember.userIds);

    // Break if the teams are full.
    fullTeams = getFullTeams(createdAt, queue, teams);
    if (fullTeams.length >= queue.getTeams(createdAt)) {
      break;
    }
  }

  return fullTeams.length >= queue.getTeams(createdAt) ? fullTeams : null;
}

function getFullTeams(createdAt: Date, queue: QueueModel, teams: IMatch.Team[]) {
  return teams.filter((t, i) => queue.getUsersPerTeam(createdAt, i) === t.userIds.length);
}
