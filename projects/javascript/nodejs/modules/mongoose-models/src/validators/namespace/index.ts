export const namespaceValidator = (documentField: string, idField: string) => {
  return {
    msg: `Value must be within the same Namespace.`,
    async validator() {
      let record = this;
      for (let i = 0; i < documentField.split('.').length - 1; i++) {
        record = record.parent();
      }

      if (record.get(idField) === null || record.get(idField) === undefined) {
        return true;
      }

      if (!record.populated(documentField)) {
        await record.populate(documentField);
      }

      const document = documentField.split('.').reduce((a, b) => a[b], record);
      return document ? document.namespaceId.equals(record.namespaceId) : false;
    },
  };
};
