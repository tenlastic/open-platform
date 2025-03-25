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

      for (let i = 0; i < teams.length; i++) {
        const usersPerTeam = threshold.usersPerTeam[i];

        if (getUsers(teams[i]) + queueMember.userIds.length > usersPerTeam) {
          continue;
        }

        teams[i].push({ ...queueMember.team, userIds: queueMember.userIds });

        break;
      }
    }

    if (teams.every((t, i) => getUsers(t) === threshold.usersPerTeam[i])) {
      return teams.map((team, i) => team.map((t) => ({ ...t, index: i }))).flat();
    }
  }

  return null;
}

function getUsers(teams: Team[]) {
  return teams.reduce((a, b) => a + b.userIds.length, 0);
}
