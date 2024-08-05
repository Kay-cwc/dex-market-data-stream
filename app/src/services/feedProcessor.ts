import { kafka, registry } from '../lib/kafka';
import { Feed, feedSchema } from './stream/types';

export async function FeedConsumer(topic: string): Promise<{
    listen: (onMessage: (feed: Feed) => Promise<void> | void) => Promise<void>;
}> {
    const consumer = kafka.consumer({
        groupId: 'dex-data-consumer',
    });
    await consumer.subscribe({ topic, fromBeginning: true });

    /**
     * start listening to the kafka topic
     */
    const listen = async (onMessage: (feed: Feed) => Promise<void> | void): Promise<void> => {
        await consumer.run({
            eachMessage: async ({ message, topic, partition }) => {
                console.log(`received msg offset at ${message.offset}`);
                const msgBuffer = message.value;
                if (!msgBuffer) {
                    console.warn(`Empty message on topic ${topic} partition ${partition}.`);
                    return;
                }
                const decodedMsg = await registry.decode(msgBuffer);
                const { success, data: feed } = feedSchema.safeParse(decodedMsg);
                if (!success || !feed) {
                    console.warn(
                        `[ZodError] Invalid message on topic ${topic} partition ${partition}. message does not match schema Feed`
                    );
                }
                if (onMessage) {
                    await onMessage(feed as Feed);
                }
            },
        });
    };

    return {
        listen,
    };
}
