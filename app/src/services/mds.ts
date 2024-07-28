// market data service
import BigNumber from 'bignumber.js';
import { Interface } from 'ethers';

import { appConfig } from '../config/env';
import { Chain, Dex, DexEvent } from '../config/web3/dex';
import { PairConfig } from '../config/web3/pair';
import { assertUnreachable, isValidEnumOrThrow } from '../lib/common';
import { Multicall } from '../lib/multicall';
import { EthLog, EthLogSchema, rpcConnectionService } from './rpcConnection';

const dexToTopics = (dex: Dex): string[] => {
    switch (dex) {
        case Dex.UNISWAP_V2:
            // pool reserve event
            return ['0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'];
        default:
            return assertUnreachable(dex);
    }
};

const topicToPoolReserve = (topic: string): DexEvent | undefined => {
    switch (topic.toLowerCase()) {
        case '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1':
            return DexEvent.POOL_RESERVE;
        default:
            return undefined;
    }
};

type Token = {
    address: string;
    decimals: number;
};

type Pair = {
    symbol: string;
    address: string;
    token0: Token;
    token1: Token;
    r0: number;
    r1: number;
    topics: string[];
};

type PairMap = {
    [address: string]: Pair;
};

const abi = new Interface([
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function decimals() external view returns (uint8)',
]);

/**
 * market data service. responsible for
 * 1. connecting to the market data stream for one chain via the rpc socket
 * 2. digest the msg from the data stream.
 * 
 * note:
 * only uniswap v2 stream is supported for now

 * @param endpoint ws endpoint for market data stream
 */
export const marketDataService = async (chain: Chain, dex: Dex, pairs_: PairConfig[]): Promise<void> => {
    isValidEnumOrThrow<Dex>(Dex, dex);
    const rpcConfig = appConfig.RPC[chain];
    console.log(`Initializing market data service for ${chain}`);

    // fetch all metadata for all pairs
    const multicall = Multicall(rpcConfig.HTTP);
    const token0 = await callToken0(multicall, pairs_);
    const token1 = await callToken1(multicall, pairs_);
    const decimal0 = await callDecimals(multicall, token0);
    const decimal1 = await callDecimals(multicall, token1);

    // to initialize all pairs
    const pairs: PairMap = pairs_.reduce((acc, pair, index) => {
        acc[pair.address.toLowerCase()] = {
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
        };
        return acc;
    }, {} as PairMap);

    const streamPoolReserve = async (log: EthLog): Promise<void> => {
        const pair = pairs[log.params.result.address];
        if (!pair) {
            console.log('Unknown pair', log.params.result);
            return;
        }
        // the output is a 130 bytes start with 0x
        // the remaining 128 bytes are the reserve0 and reserve1
        const data = log.params.result.data.slice(2);
        const reserve0 = BigNumber('0x' + data.slice(0, 64)).shiftedBy(-pair.token0.decimals);
        const reserve1 = BigNumber('0x' + data.slice(64, 128)).shiftedBy(-pair.token1.decimals);

        pairs[log.params.result.address].r0 = reserve0.toNumber();
        pairs[log.params.result.address].r1 = reserve1.toNumber();

        console.log(pairs[log.params.result.address]);
        /**
         * @remarks
         * here we can decide how to handle the data, for example, we can send it to kafka.
         * also we can store the data in a nosql cache to increase data availability
         */
    };

    const uniswapV2Callback = async (log: EthLog): Promise<void> => {
        if (!EthLogSchema.safeParse(log).success) throw new Error('Invalid log');
        log.params.result.address = log.params.result.address.toLowerCase();
        const event = topicToPoolReserve(log.params.result.topics[0]);
        if (!event) {
            console.log('Unsupported event', log.params.result);
            return;
        }

        // in future, it is possible to support more event (like add liquidity or remove liquidity)
        // this gives us the flexibility to add more event in the future
        switch (event) {
            case DexEvent.POOL_RESERVE:
                await streamPoolReserve(log);
                break;
            default:
                assertUnreachable(event);
        }
    };

    console.log(`Connecting to ${chain}-${dex} market data service`);
    const rpcConn = await rpcConnectionService(rpcConfig.WS);
    const params = {
        address: Object.values(pairs).map((pair) => pair.address),
        topics: dexToTopics(dex),
    };

    rpcConn.subscribe(params, uniswapV2Callback);
    rpcConn.connect();
};

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
