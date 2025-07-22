if [ -z "$CONTENT_CACHE_SERVER" ]; then
  echo "CONTENT_CACHE_SERVER is not set, using the default value: https://lft.ucc.cluster.local:443"
  CONTENT_CACHE_SERVER="https://lft.ucc.cluster.local:443"
fi

if [ -z "$DDCS_SERVER" ]; then
  echo "DDCS_SERVER is not set, using the default value: ddcs.ddcs.cluster.local:3010"
  DDCS_SERVER="ddcs.ddcs.cluster.local:3010"
fi

nvcf_creation_response=$(curl -s -v --location --request POST 'https://api.ngc.nvidia.com/v2/nvcf/functions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer '$NVCF_TOKEN'' \
--data '{
  "name": "'${STREAMING_FUNCTION_NAME:-usd-composer}'",
  "inferenceUrl": "'${STREAMING_START_ENDPOINT:-/sign_in}'",
  "inferencePort": '${STREAMING_SERVER_PORT:-49100}',
  "health": {
    "protocol": "HTTP",
    "uri": "/v1/streaming/ready",
    "port": '${CONTROL_SERVER_PORT:-8111}',
    "timeout": "PT10S",
    "expectedStatusCode": 200
  },
  "containerImage": "'$STREAMING_CONTAINER_IMAGE'",
  "apiBodyFormat": "CUSTOM",
  "description": "'${STREAMING_FUNCTION_NAME:-usd-composer}'",
  "functionType": "STREAMING",
  "containerEnvironment": [
    {"key": "NVDA_KIT_NUCLEUS", "value": "'$NUCLEUS_SERVER'"},
    {"key": "OMNI_JWT_ENABLED", "value": "1"},
    {"key": "NVDA_KIT_ARGS", "value": "--/UJITSO/enabled=true --/UJITSO/textures=true --/UJITSO/geometry=true --/UJITSO/materials=true --/UJITSO/datastore/GRPCDataStore/selfFile/enabled=true --/UJITSO/datastore/grpcDnsName=\"'$DDCS_SERVER'\" --/app/livestream/nvcf/sessionResumeTimeoutSeconds=300"},
    {"key": "OMNI_CONN_CACHE", "value": "'$CONTENT_CACHE_SERVER'"}
  ]
}
')

echo $nvcf_creation_response

function_id=$(echo $nvcf_creation_response | jq -r '.function.id')
function_version_id=$(echo $nvcf_creation_response | jq -r '.function.versionId')

echo "============================="
echo "Function Created Successfully"
echo "Function ID: "$function_id
echo "Function version ID: "$function_version_id
echo "Please access NVCF UI to perform find the function and perform further operations"
echo "============================="
