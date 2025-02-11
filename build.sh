DOCKER_REGISTRY="${1:-"ovc-sample-registry:42607"}"
export DOCKER_BUILDKIT=1

echo "Build backend"
docker build -t $DOCKER_REGISTRY/web-streaming-example/backend:latest -f backend/Dockerfile backend
docker push $DOCKER_REGISTRY/web-streaming-example/backend:latest

echo "Build web"
docker build -t $DOCKER_REGISTRY/web-streaming-example/web:latest -f web/Dockerfile --secret id=npmrc,src=$HOME/.npmrc web
docker push $DOCKER_REGISTRY/web-streaming-example/web:latest