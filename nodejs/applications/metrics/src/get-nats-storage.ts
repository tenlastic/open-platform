import * as nats from '@tenlastic/nats';

export async function getNatsStorage(stream: string) {
  const { state } = await nats.getStream(stream);
  return state.bytes;
}
