
d=$(jq -r .config postgres-sink-config.json)
curl -X PUT http://localhost:8083/connectors/postgres-sink/config -H "Content-Type: application/json" -d "${d}"

echo "restarting the sink..."
curl -X POST http://localhost:8083/connectors/postgres-sink/restart

echo "checking the sink status..."
curl -X GET http://localhost:8083/connectors/postgres-sink/status