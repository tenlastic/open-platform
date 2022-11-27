import 'source-map-support/register';

import '@tenlastic/logging';
import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose';
import { URL } from 'url';

import mailgun from './mailgun';
import * as nats from './nats';
import * as webServer from './web-server';
import * as webSocketServer from './web-socket-server';

const mailgunDomain = process.env.MAILGUN_DOMAIN;
const mailgunSecret = process.env.MAILGUN_SECRET;
const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const natsConnectionString = process.env.NATS_CONNECTION_STRING;
const podName = process.env.POD_NAME;

(async () => {
  try {
    // Mailgun.
    mailgun.setup({ domain: mailgunDomain, secret: mailgunSecret });

    // Minio.
    const minioConnectionUrl = new URL(minioConnectionString);
    minio.connect({
      accessKey: minioConnectionUrl.username,
      endPoint: minioConnectionUrl.hostname,
      port: Number(minioConnectionUrl.port || '443'),
      secretKey: minioConnectionUrl.password,
      useSSL: minioConnectionUrl.protocol === 'https:',
    });
    await minio.makeBucket(minioBucket);

    // MongoDB.
    await mongoose.connect({ connectionString: mongoConnectionString, databaseName: 'api' });

    // NATS.
    await nats.setup({ connectionString: natsConnectionString, database: 'api', durable: 'api' });

    // Web Server.
    const { server } = webServer.setup();

    // Web Socket Server.
    await webSocketServer.setup({ podName, server });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
