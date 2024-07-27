// market data service
import { client as WS, connection } from 'websocket';
import z from 'zod';

export type SubscripitonParams = {
    address: string[];
    topics: string[];
};

export const EthLogSchema = z.object({
    jsonrpc: z.string(),
    method: z.string(),
    params: z.object({
        subscription: z.string(),
        result: z.object({
            address: z.string(),
            blockHash: z.string(),
            blockNumber: z.string(),
            data: z.string(),
            logIndex: z.string(),
            removed: z.boolean(),
            topics: z.array(z.string()),
            transactionHash: z.string(),
            transactionIndex: z.string(),
        }),
    }),
});

export type EthLog = z.infer<typeof EthLogSchema>;

type MarketDataCallback = (log: EthLog) => void;

/**
 * market data service. responsible for connecting to the market data stream for one chain.
 * for simplicity, only allow suub
 * @param endpoint ws endpoint for market data stream
 */
export const rpcConnectionService = async (
    endpoint: string
): Promise<{
    connect: () => void;
    subscribe: (params: SubscripitonParams, callback: MarketDataCallback) => void;
}> => {
    const ws = new WS();
    let conn: connection;

    const connect = (): void => {
        ws.connect(endpoint);
    };

    const subscribe = (params: SubscripitonParams, callback: MarketDataCallback): void => {
        ws.connect(endpoint);

        ws.on('connect', (connection) => {
            conn = connection;
            conn.send(
                JSON.stringify({
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'eth_subscribe',
                    params: ['logs', params],
                })
            );

            conn.on('message', (msg) => {
                const data = JSON.parse(msg.type === 'utf8' ? msg.utf8Data : msg.binaryData.toString('utf8'));
                if (data?.method == 'eth_subscription') {
                    const log: EthLog = data;
                    callback(log);
                } else {
                    // it include
                    console.log('Unknown message', data);
                }
            });
        });
    };

    return { connect, subscribe };
};
