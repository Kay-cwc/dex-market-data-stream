import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import { Kafka, Partitioners } from 'kafkajs';

import { appConfig } from '../config/env';

const schema = `{
  "type": "record",
  "name": "mainnet-uniswap_v2-value",
  "namespace": "dex",
  "fields": [
    {
      "name": "symbol",
      "type": "string"
    },
    {
      "name": "topics",
      "type": {
        "type": "array",
        "items": "string"
      }
    },
    {
      "name": "address",
      "type": "string"
    },
    {
      "name": "token0",
      "type": {
        "type": "record",
        "namespace": "Record",
        "name": "token0",
        "fields": [
          {
            "name": "address",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "long"
          }
        ]
      }
    },
    {
      "name": "token1",
      "type": {
        "type": "record",
        "namespace": "Record",
        "name": "token1",
        "fields": [
          {
            "name": "address",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "long"
          }
        ]
      }
    },
    {
      "name": "r0",
      "type": "double"
    },
    {
      "name": "r1",
      "type": "double"
    },
    {
      "name": "basePrice",
      "type": "long"
    }
  ]
}`;

export const registry = new SchemaRegistry({ host: appConfig.SCHEMA_REGISTRY });

export const registerSchema = async (): Promise<void> => {
    const { id } = await registry.register({
        type: SchemaType.AVRO,
        schema,
    });
    console.log(`Schema registered with id: ${id}`);
};

export const kafka = new Kafka({
    clientId: 'dex-data-streamer',
    brokers: [appConfig.KAFKA_BROKER],
});

export const kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true,
    createPartitioner: Partitioners.DefaultPartitioner,
});

export const kafkaConsumer = kafka.consumer({
    groupId: 'dex-data-consumer',
});
