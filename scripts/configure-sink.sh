echo "checking the sink status..."

if [ $(curl -X GET http://localhost:8083/connectors/postgres-sink/status | jq .error_code) == '404' ]; then
    # no postgresql sink connector found
    # configure from scratch
    echo "initialising the sink..."
    curl -X POST http://localhost:8083/connectors -H "Content-Type: application/json" -d @postgres-sink-config.json
else
    # sink connector already exists
    # update the configuration
    echo "reconfiguring the sink..."
    d=$(jq -r .config postgres-sink-config.json)
    curl -X PUT http://localhost:8083/connectors/postgres-sink/config -H "Content-Type: application/json" -d "${d}"

    echo "restarting the sink..."
    curl -X POST http://localhost:8083/connectors/postgres-sink/restart
    
    echo "checking the sink status..."
    curl -X GET http://localhost:8083/connectors/postgres-sink/status
fi
