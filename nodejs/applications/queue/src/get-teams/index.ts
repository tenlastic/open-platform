import { IMatch, QueueModel, QueueMemberModel } from '@tenlastic/http';

export interface Team {
  rating?: number;
  teamId?: string;
  userIds?: string[];
}

/**
 * Matches Queue Members by filling teams first.
 */
export function getTeams(queue: QueueModel, queueMembers: QueueMemberModel[]): IMatch.Team[] {
  if (queueMembers.length === 0) {
    return null;
  }

  const milliseconds = Date.now() - queueMembers[0].createdAt.getTime();
  const seconds = milliseconds / 1000;
  const thresholds = queue.thresholds.filter((t) => seconds > t.seconds);

  for (const threshold of thresholds) {
    const teams: Team[][] = Array.from({ length: threshold.usersPerTeam.length }, () => []);

    for (const queueMember of queueMembers) {
      if (queue.teams) {
        const rating = Math.abs(queueMember.team.rating - queueMembers[0].team.rating);

        if (rating > threshold.rating) {
          continue;
        }
      }

      const currentUserCount = teams.reduce((a, b) => a + getUserCount(b), 0);
      const maximumGroupSize = Math.max(...threshold.usersPerTeam);
      const totalUserCount = threshold.usersPerTeam.reduce((a, b) => a + b, 0);
      const userIds = [...queueMember.userIds];

      for (let i = 0; i < teams.length; i++) {
        const userCount = getUserCount(teams[i]);
        const usersPerTeam = threshold.usersPerTeam[i];

        // Add Users to the Team if there is enough room.
        if (userCount + userIds.length <= usersPerTeam) {
          teams[i].push({ ...queueMember.team, userIds });
          break;
        }

        // Add Users to the Team if the Queue Member is too large for any Team,
        // there are enough positions available to accomodate the entire Group,
        // and there is any room on the Team.
        if (
          maximumGroupSize < userIds.length &&
          totalUserCount - currentUserCount >= userIds.length &&
          usersPerTeam - userCount > 0
        ) {
          const splice = userIds.splice(0, usersPerTeam - userCount);
          teams[i].push({ ...queueMember.team, userIds: splice });
        }
      }
    }

    if (teams.every((t, i) => getUserCount(t) === threshold.usersPerTeam[i])) {
      return teams.map((team, i) => team.map((t) => ({ ...t, index: i }))).flat();
    }
  }

  return null;
}

function getUserCount(teams: Team[]) {
  return teams.reduce((a, b) => a + b.userIds.length, 0);
}
