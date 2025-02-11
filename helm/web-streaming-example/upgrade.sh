helm upgrade "web-streaming-example" . \
        -f values.yaml \
        -f values.local.yaml \
        --install \
        --wait
echo "Running on https://ovc-sample:3180..."
export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=web-streaming-example,app.kubernetes.io/instance=web-streaming-example" -o jsonpath="{.items[0].metadata.name}")
export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
kubectl --namespace default port-forward $POD_NAME 3180:$CONTAINER_PORT
