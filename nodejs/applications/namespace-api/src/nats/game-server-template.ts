import { BuildPlatform, GameServerTemplateModel } from '@tenlastic/mongoose';
import { BuildEvent, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Update Game Server Templates when Build is published or unpublished.
BuildEvent.async(async (payload) => {
  if (payload.fullDocument.platform !== BuildPlatform.Server64 || !payload.fullDocument.reference) {
    return;
  }

  const buildId = payload.fullDocument._id;
  const referenceBuildId = payload.fullDocument.reference._id;
  const { updateDescription } = payload;

  if (
    payload.operationType === 'insert' ||
    (payload.operationType === 'update' && updateDescription.updatedFields.publishedAt)
  ) {
    await GameServerTemplateModel.updateMany({ buildId: referenceBuildId }, { buildId });
  } else if (
    payload.operationType === 'delete' ||
    (payload.operationType === 'update' && updateDescription.removedFields.includes('publishedAt'))
  ) {
    await GameServerTemplateModel.updateMany({ buildId }, { buildId: referenceBuildId });
  }
});

// Delete Game Server Templates if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GameServerTemplateModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
