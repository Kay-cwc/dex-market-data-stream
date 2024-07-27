import { readFileSync, readdirSync } from 'fs';
import z from 'zod';

import { Chain, Dex } from './dex';

const pairConfigSchema = z.object({
    pair: z.string(),
    address: z.string(),
});

export type PairConfig = z.infer<typeof pairConfigSchema>;

export type DexPairConfig = { [dex: string]: PairConfig[] };
export type ChainPairConfig = { [chain: string]: DexPairConfig };

export const chainPairConfig: ChainPairConfig = {};

/**
 * load all config files in this directory.
 * it uses regex to find all files that match pair_config_[A-Za-z]+\.json
 * and then parse the file content to DexPairConfig
 *
 * this function should be called only once. the config will be stored in memory then
 */
export const loadDexPairConfig = (): void => {
    const cache: ChainPairConfig = {};
    const files = readdirSync(__dirname);

    for (const file of files) {
        const exp = new RegExp(/pair_config_[A-Za-z]+\.json/);
        // find matching files
        if (exp.test(file)) {
            const [chain] = file.replace('pair_config_', '').split('.');
            const { data: chainName, success: isValidChain } = z.nativeEnum(Chain).safeParse(chain);
            if (!isValidChain) throw new Error(`Invalid chain ${chain}`);

            const config = JSON.parse(readFileSync(__dirname + `/${file}`, 'utf8'));

            // validate DexPairConfig
            Object.entries(config).forEach(([dex, pairs]) => {
                if (!z.nativeEnum(Dex).safeParse(dex)) throw new Error(`Invalid dex ${dex} from file ${file}`);
                if (!Array.isArray(pairs)) throw new Error(`Invalid config for ${chainName} and ${dex}`);
                const invalidPairConfig = pairs.filter((pair) => !pairConfigSchema.safeParse(pair).success);
                if (invalidPairConfig.length) {
                    throw new Error(`Invalid pair config for ${chainName} and ${dex}`);
                }
            });
            cache[chainName] = config as DexPairConfig;
        }
    }

    Object.assign(chainPairConfig, cache);
};

/**
 * helper function for easier access to pair config.
 * will check if the config is available for the chain and dex
 */
export const getDexPairConfig = (chain: Chain, dex: Dex): PairConfig[] => {
    const config = chainPairConfig[chain][dex];
    if (!config || !config.length) throw new Error(`Invalid config for ${chain} and ${dex}`);

    return config;
};
