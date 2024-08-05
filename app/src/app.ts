import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { join } from 'path';

import { Chain, Dex } from './config/web3/dex';
import { chainPairConfig, loadDexPairConfig } from './config/web3/pair';
import { kafkaConsumer, kafkaProducer } from './lib/kafka';
import { FeedConsumer } from './services/feedProcessor';
import { marketDataService } from './services/mds';
import { streamUniswapV2 } from './services/stream/uniswapV2';

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
    // Place here your custom code!

    // producer part
    await kafkaProducer.connect();
    loadDexPairConfig();

    const pairs = chainPairConfig[Chain.MAINNET][Dex.UNISWAP_V2];
    const mdsMainnet = await marketDataService(Chain.MAINNET, Dex.UNISWAP_V2);
    await streamUniswapV2(Chain.MAINNET, pairs, mdsMainnet);

    // consumer part
    await kafkaConsumer.connect();

    const feedConsumer = await FeedConsumer(Dex.UNISWAP_V2);
    feedConsumer.listen((feed) => fastify.log.info(feed));

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
