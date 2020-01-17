export function isValidPath(permissions, path, key) {
  const absolutePath = path.concat(key).join('.');
  if (permissions.indexOf(absolutePath) >= 0) {
    return true;
  }

  let isFound = false;
  for (let i = 0; i < path.length + 1; i++) {
    const pathSlice = path.slice(0, i);
    const wildcardPath = pathSlice.concat('*').join('.');

    if (permissions.indexOf(wildcardPath) >= 0) {
      isFound = true;
      break;
    }
  }

  return isFound;
}
