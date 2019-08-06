import { connect } from './connect';

const url = process.env.RABBITMQ_CONNECTION_STRING;

beforeEach(async function() {
  await connect({ url });
});
