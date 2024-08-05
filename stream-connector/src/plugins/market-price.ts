import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { Dex } from '../config/web3/dex';
import { kafka, registry } from '../lib/kafka';
import { Feed, feedSchema } from '../services/stream/types';

/**
 * plugin for consuming market price data from stream and to create the app state of the latest market price of each pair
 */
async function marketPricePlugin(fastify: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
    // init consumer
    fastify.log.info(`registering marketPricePlugin`);

    const consumer = kafka.consumer({
        groupId: 'market-price-group',
    });

    /** @fixme should use closure to return a fastify plugin constructor */
    await consumer.subscribe({ topic: Dex.UNISWAP_V2, fromBeginning: true });

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

    fastify.decorate('marketData', listen);
}

export default fastifyPlugin(marketPricePlugin, { fastify: '4.x', name: 'marketPricePlugin' });
