# Debezium Playground

> A playground to try debezium in local using docker-compose

## Special Compose Files

Some special compose files and their usage

### docker-compose-sink-transform.yml

This will deploy services:

- Zookeeper, using `debezium/zookeeper` image.
- Kafka, using custom docker build in folder `kafka`.
  - The container deployed will use `ADVERTISED_HOST_NAME=172.24.0.1`, which is the compose's network gateway, so you can connect to it from the host.
- PostgreSQL, using custom docker build in folder `db-olap-sink`.
  - This will be the destination database of published data from source.
- Debezium Connect, using custom docker build in folder `connect`.
  - Contains confluent's **JDBC Connector** and PostgreSQL driver.
- Transformer App, the node.js app that process the data from kafka.
  - Built from folder `transformer` with command `node index-sink-transform.js`

The source database is not deployed, and it's expected to be prepared beforehand using schema and data in [db/data.psql](./db/data.psql).

To connect to OLAP db, use command:

```bash
$ ./scripts/connect-olap-sink
```

To create connector configuration for source that needs processing:

```bash
$ ./scripts/create-connectors source1
```

To create connector configuration for JDBC sink:

```bash
$ ./scripts/create-connectors sink
```

To create connector configuration for source that doesn't needs processing:

```bash
$ ./scripts/create-connectors source2
```
