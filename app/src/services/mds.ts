// market data service
import { appConfig } from '../config/env';
import { Chain, Dex } from '../config/web3/dex';
import { isValidEnumOrThrow } from '../lib/common';
import { EthLog, SubscripitonParams, rpcConnectionService } from './rpcConnection';

export type MDS = Awaited<ReturnType<typeof marketDataService>>;

type MessageCB = (log: EthLog) => Promise<void> | void;

/**
 * market data service. responsible for
 * 1. connecting to the market data stream for one chain via the rpc socket
 * 2. digest the msg from the data stream.
 *
 * note:
 * only uniswap v2 stream is supported for now
 */
export const marketDataService = async (
    chain: Chain,
    dex: Dex
): Promise<{
    register: (args: { address: string[]; topics: string[] }, onMessage: (log: EthLog) => Promise<void> | void) => void;
}> => {
    isValidEnumOrThrow<Dex>(Dex, dex);
    const rpcConfig = appConfig.RPC[chain];
    console.log(`Initializing market data service for ${chain}`);

    const messageCBs = new Map<string, MessageCB[]>();

    console.log(`Connecting to ${chain}-${dex} market data service`);
    const rpcConn = await rpcConnectionService(rpcConfig.WS);

    const onFeed = (log: EthLog): void => {
        const topic = log.params.result.topics[0];
        if (!topic || !log.params.result.address) {
            console.log('Invalid log', log);
            return;
        }
        const key = `${log.params.result.address.toLowerCase()}-${topic.toLowerCase()}`;
        const cbs = messageCBs.get(key);
        if (cbs) {
            cbs.map((cb) => cb(log));
        }
    };

    // the only exposed function for this service
    // register a callback for a pair of address and topic
    // one compound id can have multiple registered callback. meaning multiple components can listen to the same pair
    const registerPairs = (args: SubscripitonParams, onMessage: (log: EthLog) => Promise<void> | void): void => {
        // store the callback
        args.address.forEach((address) => {
            args.topics.forEach((topic) => {
                const key = `${address.toLowerCase()}-${topic.toLowerCase()}`;
                if (!messageCBs.has(key)) {
                    messageCBs.set(key, []);
                } else {
                    messageCBs.get(key)?.push(onMessage);
                }
            });
        });

        // subscribe to the stream
        rpcConn.subscribe(args, onFeed);
    };

    rpcConn.connect();

    return {
        register: registerPairs,
    };
};
