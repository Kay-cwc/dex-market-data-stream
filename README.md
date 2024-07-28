A market data streaming using kafka pub/sub.


## Getting Started

### Fill in Env
get a rpc from any provider (must support ws connection) and fill in these env:
```
RPC_MAINNET_WS=""
RPC_MAINNET_HTTP=""
```

### Kick start the service
```
docker compose build
docker compose up
```

### Supported Dex
Currently support Mainnet UniswapV2 only. And only support for v2 pool configured in `app/src/config/web3/pair_config_mainnet.json`. You can add more pair by adding more pair address and pair id in the json file.

Then you should see the data start streaming

### NOTE
Pub/sub is not setup yet.
