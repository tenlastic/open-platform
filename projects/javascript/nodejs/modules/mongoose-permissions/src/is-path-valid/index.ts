export function isPathValid(permissions: string[], path: string[], key: string) {
  const p = permissions.reduce((previous, current) => {
    if (current.includes('.*')) {
      previous.push(current.replace('.*', ''));
    }
    previous.push(current);
    return previous;
  }, []);

  const absolutePath = path.concat(key).join('.');
  if (p.indexOf(absolutePath) >= 0) {
    return true;
  }

  let isFound = false;
  for (let i = 0; i < path.length + 1; i++) {
    const pathSlice = path.slice(0, i);
    const wildcardPath = pathSlice.concat('*').join('.');

    if (p.indexOf(wildcardPath) >= 0) {
      isFound = true;
      break;
    }
  }

  return isFound;
}
