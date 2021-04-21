export function getFileChanges(localFiles: any[], remoteFiles: any[]) {
  const modified: string[] = [];
  const unmodified: string[] = [];

  for (const lf of localFiles) {
    const remoteFile = remoteFiles.find(rf => rf.path === lf.path);

    if (remoteFile && remoteFile.md5 === lf.md5) {
      unmodified.push(lf.path);
    } else {
      modified.push(lf.path);
    }
  }

  return { modified, unmodified };
}
