import { TeamModel, TeamPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(TeamModel, TeamPermissionOptions);
