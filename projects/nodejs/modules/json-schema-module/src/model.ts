import { option, getPropertyDescriptor } from './utils';

function src(code) {
  return [eval][0](code);
}

/**
 *
 * @param model
 * @param options {}: raw means no wrapper is used
 */
function modelFactory(model, options: any = {}) {
  const rex = /this.([^\s]*) = ([^;]*);/g;
  const string = model.toString();
  let descr;

  if (/^class /.test(string)) {
    descr = rex.exec(string);

    while (descr) {
      // The value is an expression
      // The value - if object or array - has to be re-evaluated for each initialisation
      // Usually, initialisation allow the use of `this` keyword
      Object.defineProperty(getPropertyDescriptor(model.prototype, descr[1]), 'default', {
        enumerable: true,
        get: (init => () => src('(' + init + ')'))(descr[2]),
      });

      descr = rex.exec(string);
    }
  }

  descr = model.schema.properties;

  for (const i in descr) {
    if (descr[i].$ref) {
      descr[i] = { $ref: descr[i].$ref }; // removes all other properties than $ref
    } else if (descr[i].type instanceof Array) {
      descr[i].anyOf = descr[i].type;
      delete descr[i].type;
    }
  }

  descr = Object.assign({}, model.schema.definitions || {}); // the given definitions
  const used = model.defined; // the used definitions

  // Remove unused definitions and check the presence of used ones
  if (used) {
    for (const i in used) {
      if (!descr[i]) {
        console.error(`Unknown definition '${i} used in ${model.name} for ${used[i].join(', ')}.`);
      }
    }

    const keys = Object.keys(descr);
    for (const i of keys) {
      if (!used[i]) {
        delete descr[i];
      }
    }

    model.schema.definitions = descr;
  } else {
    delete model.schema.definitions;
  }

  model.schema.type = 'object';

  function ctor(...args) {
    let rv;
    let i;
    const schema = model.schema.properties;
    const csuper = Object.getPrototypeOf(model.prototype).constructor;
    rv = new csuper(...args);
    Object.setPrototypeOf(rv, model.prototype);
    for (i in schema) {
      if (undefined === rv[i]) {
        rv[i] = schema[i].default;
      }
    }

    return rv;
  }
  if (false === options.raw) {
    /*
      The wrapper is used to :
      - Have each property initialized to its default (or undefined)
      - initialize the properties after the parent classes has been called
        for the initialisation not to override constructor given values
    */
    let wrapper;
    wrapper = ctor;
    Object.assign(wrapper, model);
    wrapper.prototype = model.prototype;
    model = wrapper;
  }

  function defaults(rv = {}) {
    let i;
    const schema = model.schema.properties;

    rv || (rv = {});
    for (i in schema) {
      if (undefined === rv[i]) {
        rv[i] = schema[i].default;
      }
    }

    return rv;
  }

  model.schema = Object.assign({}, model.schema, { defaults });

  return Object.assign(model, options);
}

export function Definitions(...defs) {
  return model => {
    for (let def of defs) {
      if ('function' === typeof def && def.schema) {
        def = def.schema.properties;
      }

      option(def, model.prototype, 'schema.definitions');
    }
  };
}

export function Model(options = {}) {
  if (typeof options === 'function') {
    return modelFactory(options);
  }

  return function(model) {
    return modelFactory(model, options);
  };
}
