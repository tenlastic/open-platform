import { Document, Schema } from 'mongoose';

export function minimizePlugin(schema: Schema) {
  const paths = Object.entries(schema.paths)
    .filter(([, v]) => v.instance === 'Embedded')
    .map(([k]) => k);

  schema.set('toJSON', {
    transform: (document: Document, json: any) => {
      for (const path of paths) {
        const subdocument = document[path];
        json[path] = subdocument?.toJSON ? subdocument.toJSON() : subdocument;
      }
    },
  });

  schema.set('toObject', {
    transform: (document: Document, object: any) => {
      for (const path of paths) {
        const subdocument = document[path];
        object[path] = subdocument?.toObject ? subdocument.toObject() : subdocument;
      }
    },
  });
}
