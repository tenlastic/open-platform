import {
  BuildReleaseDockerImage,
  CopyReleaseFiles,
  CreateCollectionIndex,
  DeleteCollectionIndex,
  DeleteReleaseFiles,
  UnzipReleaseFiles,
} from './';

export function deleteAll() {
  return Promise.all([
    BuildReleaseDockerImage.purge(),
    CopyReleaseFiles.purge(),
    CreateCollectionIndex.purge(),
    DeleteCollectionIndex.purge(),
    DeleteReleaseFiles.purge(),
    UnzipReleaseFiles.purge(),
  ]);
}
