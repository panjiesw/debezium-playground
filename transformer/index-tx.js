const TTLCache = require('@isaacs/ttlcache');
const { Kafka } = require('kafkajs');

const client = new Kafka({
  clientId: 'example-app',
  brokers: ['kafka:9092'],
});

const consumer = client.consumer({ groupId: 'my-group' });

const tx = new TTLCache({ ttl: 60000, max: 1000 });

async function run() {
  await consumer.connect();
  await consumer.subscribe({
    topics: [
      'dbz_postgres.transaction',
      'dbz_postgres.public.customers',
      'dbz_postgres.public.products',
      'dbz_postgres.public.orders',
      'dbz_postgres.public.products_on_hand',
    ],
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const key = JSON.parse(message.key.toString('utf-8'));
      const value = JSON.parse(message.value.toString('utf-8'));

      if (topic === 'dbz_postgres.transaction') {
        console.log(`Received transaction:`);
        console.dir({ key, value }, { depth: null });

        if (value.status === 'BEGIN') {
          tx.set(key.id, { data: {}, data_collections: {} });
          return;
        } else {
          for (const dc of value.data_collections) {
            const txc = tx.get(key.id);
            txc.data_collections[dc.data_collection] = dc.event_count;
            tx.set(key.id, txc);
          }
        }
      } else {
        const tableFQN = topic.split('dbz_postgres.')[1];

        if (value.transaction != null) {
          if (!tx.has(value.transaction.id)) {
            tx.set(value.transaction.id, { data: {}, data_collections: {} });
          }
          console.log(`[TRANSACTION_PART] Received event "${tableFQN}":`);
          console.dir({ key, value }, { depth: null });

          const txc = tx.get(value.transaction.id);
          txc.data[tableFQN] = [...(txc.data[tableFQN] || []), value.after];
          tx.set(value.transaction.id, txc);
        } else {
          console.log(`Received event "${tableFQN}":`);
          console.dir({ key, value }, { depth: null });
          return;
        }
      }

      if (tx.size > 0) {
        console.log('Checking transactions buffer since size is:', tx.size);
        txLoop: for (const txc of tx.entries()) {
          const tables = Object.keys(txc[1].data_collections);
          if (tables.length > 0) {
            // We've received END / COMMIT transaction event, check data completeness.

            for (const tableFQN of tables) {
              if (
                txc[1].data_collections[tableFQN] !==
                (txc[1].data[tableFQN] || []).length
              ) {
                // we haven't received all the event data that's part of the transaction
                // don't process it further.
                console.log(`Transaction ${txc[0]} still in progress`);
                continue txLoop;
              }
            }

            // If we reach here, it means we have buffered all data of the transaction
            // process it.
            console.log(`Transaction ${txc[0]} completed:`);
            console.dir(txc[1], { depth: null });
            tx.delete(txc[0]);
          }
        }
      }
    },
  });
}

run();
