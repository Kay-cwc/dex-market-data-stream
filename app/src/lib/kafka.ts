import { Kafka, Partitioners } from 'kafkajs';

import { appConfig } from '../config/env';

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
