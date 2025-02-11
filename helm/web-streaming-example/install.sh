helm uninstall web-streaming-example --wait --ignore-not-found
helm install web-streaming-example . -f values.yaml -f values.local.yaml --wait
echo "Running on https://ovc-sample:3180..."
