import { Dex } from '../config/web3/dex';
import { FeedConsumer } from './feedProcessor';
import { Feed } from './stream/types';

function UniswapV2MarketData(): {
    state: Record<string, Feed>;
    start: () => Promise<void>;
} {
    const state: Record<string, Feed> = {};

    const start = async (): Promise<void> => {
        const feedConsumer = await FeedConsumer(Dex.UNISWAP_V2);
        feedConsumer.listen((feed) => {
            console.log('feed', feed);
            state[feed.symbol] = feed;
        });
    };

    return { state, start };
}

export const uniswapV2MarketData = UniswapV2MarketData();
