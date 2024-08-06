import { FastifyPluginAsync } from 'fastify';

import { uniswapV2MarketData } from '../services/uniswapV2MarketData';

const marketDataRoute: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    const uniswapV2State = uniswapV2MarketData.state;

    fastify.get('/uniswap-v2', async function (request, reply) {
        return uniswapV2State;
    });
};

export default marketDataRoute;
