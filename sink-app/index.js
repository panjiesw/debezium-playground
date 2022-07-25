const { Kafka } = require('kafkajs');

const client = new Kafka({
  clientId: 'sink-app',
  brokers: ['172.24.0.1:9092'],
});

const producer = client.producer({
  transactionalId: 'my-transactional-producer',
  maxInFlightRequests: 1,
  idempotent: true,
  allowAutoTopicCreation: false,
  transactionTimeout: 30000,
});

async function produce() {
  await producer.connect();
  await producer.send({
    topic: 'customers',
    messages: [
      {
        key: JSON.stringify({
          schema: {
            type: 'struct',
            optional: false,
            version: 1,
            fields: [{ field: 'id', type: 'int32', optional: false }],
          },
          payload: { id: 1001 },
        }),
        value: JSON.stringify({
          schema: {
            type: 'struct',
            optional: false,
            version: 1,
            fields: [
              { field: 'id', type: 'int32', optional: false },
              { field: 'first_name', type: 'string' },
              { field: 'last_name', type: 'string' },
              { field: 'email', type: 'string' },
            ],
          },
          payload: {
            id: 1001,
            first_name: 'panjie',
            last_name: 'wicaksono',
            email: 'panjie@example.com',
          },
        }),
      },
    ],
  });
  await producer.disconnect();
}

produce();
