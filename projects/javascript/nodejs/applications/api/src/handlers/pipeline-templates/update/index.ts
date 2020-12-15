import { PipelineTemplatePermissions } from '@tenlastic/mongoose-models';

import { updateOne } from '../../../defaults';

export const handler = updateOne(PipelineTemplatePermissions);
