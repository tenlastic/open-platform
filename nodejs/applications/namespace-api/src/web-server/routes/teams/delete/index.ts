import { TeamModel, TeamPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(TeamModel, TeamPermissionOptions);
