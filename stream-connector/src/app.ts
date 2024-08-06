import fastify from 'fastify';

import { appConfig } from './config/env';
import { Chain, Dex } from './config/web3/dex';
import { chainPairConfig, loadDexPairConfig } from './config/web3/pair';
import { kafkaProducer } from './lib/kafka';
import marketDataDexRoute from './routes/dex';
import { marketDataService } from './services/mds';
import { streamUniswapV2 } from './services/stream/uniswapV2';
import { uniswapV2MarketData } from './services/uniswapV2MarketData';

loadDexPairConfig();

// export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}
// // Pass --options via CLI arguments in command to enable these options.
// const options: AppOptions = {};

// const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
//     // Place here your custom code!

//     // producer part
//     await kafkaProducer.connect();
//     loadDexPairConfig();

//     const pairs = chainPairConfig[Chain.MAINNET][Dex.UNISWAP_V2];
//     const mdsMainnet = await marketDataService(Chain.MAINNET, Dex.UNISWAP_V2);
//     await streamUniswapV2(Chain.MAINNET, pairs, mdsMainnet);

//     // consumer part
//     await kafkaConsumer.connect();

//     // const feedConsumer = await FeedConsumer(Dex.UNISWAP_V2);
//     // feedConsumer.listen((feed) => fastify.log.info(feed));

//     // Do not touch the following lines

//     // This loads all plugins defined in plugins
//     // those should be support plugins that are reused
//     // through your application
//     void fastify.register(AutoLoad, {
//         dir: join(__dirname, 'plugins'),
//         options: opts,
//     });

//     // This loads all plugins defined in routes
//     // define your routes in one of these
//     void fastify.register(AutoLoad, {
//         dir: join(__dirname, 'routes'),
//         options: opts,
//     });
// };

const app = fastify({ logger: true });
app.register(marketDataDexRoute, { prefix: '/market-data' });

const start = async (): Promise<void> => {
    try {
        const address = await app.listen({
            port: appConfig.FASTIFY_PORT,
            host: '0.0.0.0',
        });
        app.log.info(`server listening on ${address}`);
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

app.addHook('onListen', async () => {
    // producer
    await kafkaProducer.connect();
    const mds = await marketDataService(Chain.MAINNET, Dex.UNISWAP_V2);
    const pairs = chainPairConfig[Chain.MAINNET][Dex.UNISWAP_V2];
    await streamUniswapV2(Chain.MAINNET, pairs, mds);

    // consumer
    await uniswapV2MarketData.start();
});

start();
