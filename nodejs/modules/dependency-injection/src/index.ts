export type Constructor<T = unknown> = new (...args: unknown[]) => T;

export interface Injection<T = unknown> {
  deps?: Constructor[];
  provide: Constructor<T>;
  useFactory?: (...args: unknown[]) => T;
  useValue?: T;
}

const _cache = new Map<Constructor, unknown>();
let _injections: Injection[] = [];

export function get<T>(dep: Constructor<T>, stack: Constructor[] = []): T {
  if (_cache.has(dep)) {
    return _cache.get(dep) as T;
  }

  const injection = _injections.find((i) => i.provide === dep) as Injection<T> | undefined;

  if (!injection) {
    return null;
  } else if (injection.useFactory) {
    useFactory(injection, stack);
  } else if (injection.useValue !== undefined) {
    useValue(injection);
  }

  return _cache.get(dep) as T;
}

export function inject(injections: Injection[]) {
  _injections = injections;

  for (const injection of injections.filter((i) => 'useValue' in i)) {
    get(injection.provide);
  }

  for (const injection of injections.filter((i) => 'useFactory' in i)) {
    get(injection.provide);
  }
}

function useFactory<T>(injection: Injection<T>, stack: Constructor[]) {
  let value: T;

  if (injection.deps) {
    const deps = injection.deps.map((d) => {
      if (stack.includes(d)) {
        throw new Error(`Circular dependency between ${d.name} and ${injection.provide.name}.`);
      }
      return get(d, [...stack, injection.provide])!;
    });

    value = injection.useFactory!(...deps);
  } else {
    value = injection.useFactory!();
  }

  _cache.set(injection.provide, value);
}

function useValue<T>(injection: Injection<T>) {
  _cache.set(injection.provide, injection.useValue!);
}
