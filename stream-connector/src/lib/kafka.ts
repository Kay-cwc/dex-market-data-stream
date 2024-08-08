import { Kafka, Partitioners } from 'kafkajs';

import { appConfig } from '../config/env';

// export const registry = new SchemaRegistry({ host: appConfig.SCHEMA_REGISTRY });

// export const registerSchema = async (schemaName: string): Promise<number> => {
//     // read all .avdl form the schema folder and register them
//     const schemaPath = path.resolve(__dirname, `../../schema/${schemaName}.avdl`);
//     const schema = await avdlToAVSCAsync(schemaPath);
//     /**
//      * we need this to adopt the TopicNameStrategy
//      * @see https://docs.confluent.io/platform/current/schema-registry/fundamentals/serdes-develop/index.html#how-the-naming-strategies-work
//      */
//     const { id } = await registry.register(
//         {
//             type: SchemaType.AVRO,
//             schema: JSON.stringify(schema),
//         },
//         { separator: '-' }
//     );
//     console.log(`Schema ${schema.namespace}-value registered with id: ${id}`);

//     return id;
// };

export const kafka = new Kafka({
    clientId: 'dex-data-streamer',
    brokers: [appConfig.KAFKA_BROKER],
    connectionTimeout: 30000, // 15 seconds
    retry: {
        initialRetryTime: 1000,
        retries: 8,
    },
    // logLevel: logLevel.DEBUG,
});

export const kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true,
    createPartitioner: Partitioners.DefaultPartitioner,
});

export const kafkaConsumer = kafka.consumer({
    groupId: 'dex-data-consumer',
});
