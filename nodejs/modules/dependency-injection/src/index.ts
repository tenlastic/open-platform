export interface Injection {
  deps?: Constructor[];
  provide: Constructor;
  useFactory?: (...args: any[]) => any;
  useValue?: any;
}

export type Constructor<T = any> = new (...args: any[]) => T;

const _cache = new Map<Constructor, any>();
let _injections: Injection[] = [];

export function get<T>(dep: Constructor<T>, stack: Constructor[] = []): T {
  if (_cache.has(dep)) {
    return _cache.get(dep);
  }

  const injection = _injections.find((i) => i.provide === dep);

  if (!injection) {
    return null;
  } else if (injection.useFactory) {
    useFactory(injection, stack);
  } else if (injection.useValue) {
    useValue(injection);
  }

  return _cache.get(dep);
}

export function inject(injections: Injection[]) {
  _injections = injections;

  const values = injections.filter((i) => 'useValue' in i);
  for (const injection of values) {
    get(injection.provide);
  }

  const factories = injections.filter((i) => 'useFactory' in i);
  for (const injection of factories) {
    get(injection.provide);
  }
}

function useFactory(injection: Injection, stack: Constructor[]) {
  let value: Injection['useFactory'];

  if (injection.deps) {
    const deps = injection.deps?.map((d) => {
      if (stack.includes(d)) {
        throw new Error(`Circular dependency between ${d.name} and ${injection.provide.name}.`);
      }

      return get(d, [...stack, injection.provide]);
    });

    value = injection.useFactory(...deps);
  } else {
    value = injection.useFactory(...[]);
  }

  _cache.set(injection.provide, value);
}

function useValue(injection: Injection) {
  _cache.set(injection.provide, injection.useValue);
}
