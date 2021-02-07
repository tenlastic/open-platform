export function isPathValid(permissions: string[], path: string[], key: string) {
  const p = permissions.reduce((previous, current) => {
    if (current.includes('.*')) {
      previous.push(current.replace('.*', ''));
    }

    const split = current.split('.');
    for (let i = 1; i <= split.length; i++) {
      const permutation = split.slice(0, i).join('.');
      previous.push(permutation);
    }

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
