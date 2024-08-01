import z from 'zod';

export const tokenSchema = z.object({
    address: z.string(),
    decimals: z.number(),
});

export type Token = z.infer<typeof tokenSchema>;

// base schema for feed. This is the minimum required to create a feed.
// some dex will require specific schema. For example, uniswap v2 will require r0 and r1
export const feedSchema = z.object({
    symbol: z.string(),
    address: z.string(),
    token0Address: z.string(),
    token1Address: z.string(),
    token0Decimal: z.number(),
    token1Decimal: z.number(),
    r0: z.number(),
    r1: z.number(),
    basePrice: z.number(),
    topics: z.array(z.string()),
});

export type Feed = z.infer<typeof feedSchema>;
