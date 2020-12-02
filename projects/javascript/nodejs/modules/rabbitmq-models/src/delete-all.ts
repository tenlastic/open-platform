import {
  BuildDockerImage,
  CopyBuildFiles,
  CreateCollectionIndex,
  DeleteCollectionIndex,
  DeleteBuildFiles,
  UnzipBuildFiles,
} from './';

export function deleteAll() {
  return Promise.all([
    BuildDockerImage.purge(),
    CopyBuildFiles.purge(),
    CreateCollectionIndex.purge(),
    DeleteCollectionIndex.purge(),
    DeleteBuildFiles.purge(),
    UnzipBuildFiles.purge(),
  ]);
}
