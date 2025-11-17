# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: MIT
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
# DEALINGS IN THE SOFTWARE.

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
    {"key": "NVDA_KIT_ARGS", "value": "--/app/livestream/nvcf/sessionResumeTimeoutSeconds=300"}
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
