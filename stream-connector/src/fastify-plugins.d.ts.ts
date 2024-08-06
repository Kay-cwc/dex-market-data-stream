// Import the type of your plugin if available
import { UniswapV2StreamPlugin } from './plugins/stream/uniswap-v2-stream';

declare module 'fastify' {
    export interface FastifyInstance {
        uniswapV2Stream: UniswapV2StreamPlugin;
    }
}
