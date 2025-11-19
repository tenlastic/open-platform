import { BehaviorSubject, map, Observable } from 'rxjs';

export class State<TModel> {
  private key: keyof TModel;
  private map = new Map<unknown, TModel>();
  private subject = new BehaviorSubject(new Map<unknown, TModel>());

  constructor(key: keyof TModel) {
    this.key = key;
  }

  public getMany(): TModel[] {
    return [...this.map.values()];
  }

  public getOne(key: unknown): TModel {
    return this.map.get(key);
  }

  public hasOne(key: unknown): boolean {
    return this.map.has(key);
  }

  public removeOne(key: unknown): boolean {
    const deleted = this.map.delete(key);

    if (deleted) {
      this.subject.next(this.map);
    }

    return deleted;
  }

  public reset() {
    this.map.clear();
    this.subject.next(this.map);
  }

  public selectOne(key: unknown): Observable<TModel> {
    return this.subject.pipe(map((m) => m.get(key)));
  }

  public selectMany(): Observable<TModel[]> {
    return this.subject.pipe(map((m) => [...m.values()]));
  }

  public upsertMany(records: TModel[]) {
    if (!records) {
      return;
    }

    for (const record of records) {
      const key = record[this.key];
      this.map.set(key, record);
    }

    this.subject.next(this.map);
  }

  public upsertOne(record: TModel) {
    return this.upsertMany([record]);
  }
}
