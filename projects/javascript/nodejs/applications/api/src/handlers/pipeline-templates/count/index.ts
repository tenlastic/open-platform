import { PipelineTemplatePermissions } from '@tenlastic/mongoose-models';

import { count } from '../../../defaults';

export const handler = count(PipelineTemplatePermissions);
