import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { join } from 'path';

import { Chain, Dex } from './config/web3/dex';
import { chainPairConfig, loadDexPairConfig } from './config/web3/pair';
import { kafkaConsumer, kafkaProducer } from './lib/kafka';
import { FeedConsumer } from './services/feed';
import { marketDataService } from './services/mds';

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
    // Place here your custom code!
    await kafkaProducer.connect();
    loadDexPairConfig();

    Object.values(Chain).map(async (chain) => {
        marketDataService(chain, Dex.UNISWAP_V2, chainPairConfig[chain][Dex.UNISWAP_V2]);
    });

    await kafkaConsumer.connect();

    const topic = `${Chain.MAINNET}-${Dex.UNISWAP_V2}`;
    const feedConsumer = await FeedConsumer(topic);
    feedConsumer.listen((feed) => console.log(feed));

    // Do not touch the following lines

    // This loads all plugins defined in plugins
    // those should be support plugins that are reused
    // through your application
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'plugins'),
        options: opts,
    });

    // This loads all plugins defined in routes
    // define your routes in one of these
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        options: opts,
    });
};

export default app;
export { app, options };
