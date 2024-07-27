A market data streaming using kafka pub/sub.

Currently support Mainnet UniswapV2 only.

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

Then you should see the data start streaming

### NOTE
Pub/sub is not setup yet.
