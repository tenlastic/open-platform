export const namespaceValidator = (documentField: string, idField: string) => {
  return {
    msg: `${idField} must be within the same Namespace.`,
    async validator() {
      if (!this.populated(documentField)) {
        await this.populate(documentField).execPopulate();
      }

      return this[documentField] ? this[documentField].namespaceId.equals(this.namespaceId) : true;
    },
  };
};
