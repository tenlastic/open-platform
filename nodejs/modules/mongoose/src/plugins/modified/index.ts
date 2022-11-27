import { Schema } from 'mongoose';

export interface ModifiedPlugin {
  wasModified(path?: string | string[]): boolean;
  wasNew: boolean;
}

export function modifiedPlugin(schema: Schema) {
  schema.method('wasModified', function (path?: string | string[]) {
    if (Array.isArray(path)) {
      return this.previouslyModifiedPaths.some((pmp) => path.includes(pmp));
    } else if (path) {
      return this.previouslyModifiedPaths.includes(path);
    } else {
      return this.previouslyModifiedPaths.length > 0;
    }
  });

  schema.pre('save', function () {
    this.previouslyModifiedPaths = this.modifiedPaths();
    this.wasNew = this.isNew;
  });
}
