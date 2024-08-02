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

### After the service is up
We need to configure the schema for the topic and configure the postgresql sink for kafka connectors. Run the following command:

```
cd ./scripts
sh configure-sink.sh # this will configure the sink for postgresql
```

Note:
we no longer need to manually configure the schema for the topic. The schema will be automatically created when the producer is up and running.  
all schema is declared in avdl format and is located in `app/src/avro/` folder.  
the file name is the topic name.  

### Supported Dex
Currently support Mainnet UniswapV2 only. And only support for v2 pool configured in `app/src/config/web3/pair_config_mainnet.json`. You can add more pair by adding more pair address and pair id in the json file.

Then you should see the data start streaming
Data will now be sinked in postgresql as log as well
