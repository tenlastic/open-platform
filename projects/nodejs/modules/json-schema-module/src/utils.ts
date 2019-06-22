import 'reflect-metadata';

export const factories = {
  makeType: [],
};

export const jsdTypes = {
  Array: 'array',
  Boolean: 'boolean',
  Date: 'string',
  Number: 'number',
  Object: 'object',
  String: 'string',
};

export function option(value, model, ...path) {
  for (let i = 0; i < path.length; ++i) {
    path.splice(i, 1, ...path[i].split('.'));
  }

  if ('function' !== typeof model) {
    path.unshift('constructor');
  }

  while (1 < path.length) {
    const attr = path.shift();
    model = model[attr] || (model[attr] = {});
  }

  const prop = path[0];
  if (model.hasOwnProperty(prop)) {
    if (Object === value.constructor) {
      model[prop] = Object.assign({}, model[prop], value);
    }

    return model[prop];
  }

  return (model[prop] = value);
}

export function getPropertyDescriptor(model, key) {
  const props = option({}, model, 'schema.properties', key);

  if (!props.type && !props.$ref) {
    const type = (Reflect as any).getMetadata('design:type', model, key);

    if (type) {
      Object.assign(props, makeType(type, model, key));
    }
  }

  return props;
}

export function createPropertyDecorator(descriptor, restriction?) {
  return (model, key) => {
    const propDescr = getPropertyDescriptor(model, key);
    Object.assign(
      propDescr,
      'function' === typeof descriptor ? descriptor(model, key) : descriptor,
    );
  };
}

export function makeType(type, model, property) {
  for (const factory of factories.makeType) {
    const trial = factory(type, model, property);

    if (trial) {
      return trial;
    }
  }

  if (Object === type.constructor) {
    return type;
  }

  if ('function' === typeof type) {
    if (type.schema) {
      type = Object.assign({ type: 'object' }, type.schema);
    } else {
      const typeName = type.name;
      type = { type: jsdTypes[type.name] || 'object' };

      if (typeName === 'Date') {
        type.pattern = 'd{4}-[01]d-[0-3]dT[0-2]d:[0-5]d:[0-5]d.d+([+-][0-2]d:[0-5]d|Z)';
      }
    }
  } else if ('string' === typeof type) {
    type = { type };
  }

  return type;
}
