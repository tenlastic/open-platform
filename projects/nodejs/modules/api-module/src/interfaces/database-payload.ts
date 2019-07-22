export interface DatabasePayload<T> {
  after: Partial<T>;
  before: Partial<T>;
}
