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
    {"key": "NVDA_KIT_ARGS", "value": "--/app/livestream/nvcf/sessionResumeTimeoutSeconds=30"}
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
