import { Collection } from 'mongodb';
import { mongoose } from '@typegoose/typegoose';

export interface ReplicaSetMemberStatus {
  _id: number;
  health: number;
  name: string;
  state: number;
  uptime: number;
}

export async function status() {
  const collections = await mongoose.connection.db.collections();
  const { members, ok } = await mongoose.connection.db.admin().replSetGetStatus();

  const primary: ReplicaSetMemberStatus = members.find((m) => m.state === 1);
  const secondaries: ReplicaSetMemberStatus = members.find((m) => m.state !== 1);

  return { collections: collections as Collection[], health: ok, primary, secondaries };
}
