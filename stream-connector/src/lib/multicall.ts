import { ethers } from 'ethers';

const abi = [
    'function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)',
    'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
    'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
    'function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
    'function getBasefee() view returns (uint256 basefee)',
    'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
    'function getBlockNumber() view returns (uint256 blockNumber)',
    'function getChainId() view returns (uint256 chainid)',
    'function getCurrentBlockCoinbase() view returns (address coinbase)',
    'function getCurrentBlockDifficulty() view returns (uint256 difficulty)',
    'function getCurrentBlockGasLimit() view returns (uint256 gaslimit)',
    'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
    'function getEthBalance(address addr) view returns (uint256 balance)',
    'function getLastBlockHash() view returns (bytes32 blockHash)',
    'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
    'function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
];

const address = '0xcA11bde05977b3631167028862bE2a173976CA11';

type MultiCallParam = { address: string; calldata: string };

/**
 * a generic multicall function that can be used to fetch multiple data in one call
 * note that the response may need extra parsing as the return types are array of bytes
 *
 * one handy approach is to reuse the abi instance on the call params to decode the return data
 * @example given a function that return an address, we can do this to parse the address from the return data
 * ```
 * res.map((d) => abi.decodeFunctionResult('<function fragment', d)[0])
 * ```
 *
 * for some simpler cases (e.g. return an uint256), we can just use the ethers.BigNumber.from(d) to parse the return data
 */
export const Multicall = (rpc: string): (<T>(...params: MultiCallParam[]) => Promise<T[]>) => {
    const contract = new ethers.Contract(address, abi, new ethers.JsonRpcProvider(rpc));

    const fetch = async <T>(...params: MultiCallParam[]): Promise<T[]> => {
        const calls = params.map((p) => ({ target: p.address, callData: p.calldata }));
        const result = await contract.aggregate.staticCall(calls);
        return result.returnData.map((d: T) => d);
    };

    return fetch;
};
