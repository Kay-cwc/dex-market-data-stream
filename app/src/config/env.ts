import { z } from 'zod';

import { Chain } from './web3/dex';

const AppConfigSchema = z.object({
    NODE_ENV: z.string(),
    FASTIFY_PORT: z.coerce.number(),
    KAFKA_BROKER: z.string(),
    RPC: z.object({
        [Chain.MAINNET]: z.object({
            WS: z.string(),
            HTTP: z.string(),
        }),
    }),
});

export type TAppConfig = z.infer<typeof AppConfigSchema>;

export const appConfig = ((): TAppConfig => {
    const env = process.env;
    const parsedEnv = AppConfigSchema.parse({
        NODE_ENV: env.NODE_ENV,
        FASTIFY_PORT: env.FASTIFY_PORT,
        KAFKA_BROKER: env.KAFKA_BROKER,
        RPC: {
            [Chain.MAINNET]: {
                WS: env.RPC_MAINNET_WS,
                HTTP: env.RPC_MAINNET_HTTP,
            },
        },
    });
    return parsedEnv;
})();
