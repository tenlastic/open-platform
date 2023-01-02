import { Document, Schema } from 'mongoose';

export function setPlugin(schema: Schema) {
  schema.eachPath((path, type) => {
    if (type.instance !== 'Embedded' || type.options?.set) {
      return;
    }

    type.set(function (value: any) {
      const json = value.toJSON ? value.toJSON() : value;
      const subdocument = type.cast(json, this, true) as Document;

      for (const [k, v] of Object.entries(json)) {
        const property = subdocument.schema.path(k) as any;
        const set = property?.options?.set?.bind(subdocument);
        const setters = property?.setters || [];

        subdocument.set(k, set && !setters.includes(set) ? set(v) : v);
      }

      if (this instanceof Document) {
        const error = subdocument.validateSync();

        for (const [k, v] of Object.entries(error?.errors ?? {})) {
          this.invalidate(`${path}.${k}`, v.message, v.value, v.kind);
        }
      }

      return subdocument;
    });
  });
}
