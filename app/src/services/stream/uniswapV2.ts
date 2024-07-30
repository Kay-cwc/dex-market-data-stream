import BigNumber from 'bignumber.js';
import { Interface } from 'ethers';

import { appConfig } from '../../config/env';
import { Chain, Dex } from '../../config/web3/dex';
import { PairConfig } from '../../config/web3/pair';
import { assertUnreachable } from '../../lib/common';
import { kafkaProducer } from '../../lib/kafka';
import { Multicall } from '../../lib/multicall';
import { MDS } from '../mds';
import { EthLog } from '../rpcConnection';
import { Feed } from './types';

export const streamUniswapV2 = async (chain: Chain, pairs: PairConfig[], mds: MDS): Promise<void> => {
    const dex = Dex.UNISWAP_V2;
    const rpcConfig = appConfig.RPC[chain];

    // fetch all metadata for all pairs
    const multicall = Multicall(rpcConfig.HTTP);
    const token0 = await callToken0(multicall, pairs);
    const token1 = await callToken1(multicall, pairs);
    const decimal0 = await callDecimals(multicall, token0);
    const decimal1 = await callDecimals(multicall, token1);

    // to initialize all pairs
    const feeds = pairs.reduce((acc, pair, index) => {
        acc.set(pair.address.toLowerCase(), {
            symbol: pair.pair,
            topics: dexToTopics(dex),
            address: pair.address.toLowerCase(),
            token0: {
                address: token0[index],
                decimals: decimal0[index],
            },
            token1: {
                address: token1[index],
                decimals: decimal1[index],
            },
            r0: 0,
            r1: 0,
            basePrice: 0,
        });
        return acc;
    }, new Map<string, Feed>());

    const streamPoolReserve = async (log: EthLog): Promise<void> => {
        const pair = feeds.get(log.params.result.address);
        if (!pair) {
            console.log('Unknown pair', log.params.result);
            return;
        }
        // the output is a 130 bytes start with 0x
        // the remaining 128 bytes are the reserve0 and reserve1
        const data = log.params.result.data.slice(2);
        const reserve0 = BigNumber('0x' + data.slice(0, 64)).shiftedBy(-pair.token0.decimals);
        const reserve1 = BigNumber('0x' + data.slice(64, 128)).shiftedBy(-pair.token1.decimals);

        const feed = feeds.get(log.params.result.address);
        if (!feed) {
            console.log('Unknown pair', log.params.result);
            return;
        }
        feed.r0 = reserve0.toNumber();
        feed.r1 = reserve1.toNumber();

        feeds.set(log.params.result.address, feed);

        /**
         * @remarks
         * here we can decide how to handle the data, for example, we can send it to kafka.
         * also we can store the data in a nosql cache to increase data availability
         */

        await kafkaProducer.send({
            topic: `${chain}-${dex}`,
            messages: [
                {
                    key: 'pool_reserve',
                    value: JSON.stringify(feed),
                },
            ],
        });
    };

    // register the processor to the mds
    mds.register(
        {
            address: Object.values(pairs).map((pair) => pair.address),
            topics: dexToTopics(dex),
        },
        streamPoolReserve
    );
};

const dexToTopics = (dex: Dex): string[] => {
    switch (dex) {
        case Dex.UNISWAP_V2:
            // pool reserve event
            return ['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'];
        default:
            return assertUnreachable(dex);
    }
};

const abi = new Interface([
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function decimals() external view returns (uint8)',
]);

// multicall for all pair token 0
const callToken0 = async (multicall: Awaited<ReturnType<typeof Multicall>>, pairs: PairConfig[]): Promise<string[]> => {
    const res = await multicall<string>(
        ...pairs.map((pair) => {
            return {
                address: pair.address,
                calldata: abi.encodeFunctionData('token0'),
            };
        })
    );
    return res.map((d) => abi.decodeFunctionResult('token0', d)[0]);
};

// multicall for all pair token 1
const callToken1 = async (multicall: Awaited<ReturnType<typeof Multicall>>, pairs: PairConfig[]): Promise<string[]> => {
    const res = await multicall<string>(
        ...pairs.map((pair) => {
            return {
                address: pair.address,
                calldata: abi.encodeFunctionData('token1'),
            };
        })
    );
    return res.map((d) => abi.decodeFunctionResult('token1', d)[0]);
};

// multicall for all pair decimals
const callDecimals = async (multicall: Awaited<ReturnType<typeof Multicall>>, tokens: string[]): Promise<number[]> => {
    const res = await multicall<string>(
        ...tokens.map((token) => {
            return {
                address: token,
                calldata: abi.encodeFunctionData('decimals'),
            };
        })
    );
    return res.map((d) => parseInt(d, 16));
};
