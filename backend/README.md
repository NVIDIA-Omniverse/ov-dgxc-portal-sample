# Omniverse Cloud Portal Sample (Customer Backend)

This folder contains an example for the backend service which provides a REST API for 
specifying additional metadata for NVCF functions and endpoints for managing streaming sessions.

When a new NVCF function is deployed, this service can be used to attach the following information:
* Title
* Description
* Version
* Product area (e.g., Omniverse)
* Logo
* Publication date

This information can only be published by users added to the group 
configured in `admin_group` setting for this service:

![ovc-streaming-publishing.png](/docs/images/ovc-streaming-publishing.png)

Web applications can utilize the Customer Backend to display NVCF functions as streamable applications:

![ovc-streaming-list.png](/docs/images/ovc-streaming-list.png)

This service is also acts as an intermediary proxy and a message broker between the web frontend and Kit-based 
applications deployed on NVCF. The web frontend establishes a WebSocket connection to this backend service which 
verifies that the user is authenticated and authorized to establish a stream. The service injects Starfleet API Key 
to the WebSocket request and forwards it to the specified NVCF function to establish a signaling channel for starting 
a stream:

![ovc-streaming-join.png](/docs/images/ovc-streaming-join.png)

## Prerequisites

* [Python 3.12](https://www.python.org/downloads/)
* [Poetry](https://python-poetry.org/docs/#installation)

## Install

Run `poetry install` command to install project dependencies via PIP.

## Run

Create `settings.toml` file in the `backend` folder with the following content:
```toml
# The client ID registered in the IdP for this example.
client_id = "..."

# Starfleet API Key that will be injected into /sessions/sign_in endpoint.
# This key needs to be generated on https://ngc.nvidia.com portal.
nvcf_api_key = "..."
```

If you'd like to run the service with the web application running with `npm run dev` command, 
add `unsafe_disable_auth = true` setting to `settings.toml` file:

```toml
# Disables authentication for this backend.
# Use only for development.
unsafe_disable_auth = true
```

If you need to enable authentication, the following parameters must be provided in `settings.toml` file:

```toml
# The endpoint used to obtain public keys (JWK) for validating user tokens. 
# Must point to jwks_uri field from the Configuration Request.
# https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
jwks_uri = "..."

# The algorithm used by the IdP to generate ID tokens.
jwks_alg = "ES256"

# Number of seconds to cache public keys (JWK) retrieved from jwks_uri.
jwks_ttl = 900

# The endpoint used to obtain additional user info from the IdP.
# Must point to userinfo_endpoint field from the Configuration Request.
# https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig
userinfo_endpoint = "..."

# Number of seconds to cache user info retrieved from userinfo_endpoint."""
userinfo_ttl = 900

# The user group required for updating or deleting data via the API.
admin_group = "admin"
```

Use `poetry run api` command to run the service. Open http://localhost:8000 in your browser to see the API docs.

### API

Create or update an application called `usd-validate` with the specified function ID and function version ID from NVCF:

```bash
curl -X 'PUT' \
  'http://127.0.0.1:8000/apps/usd-validate' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "slug": "usd-validate",
  "function_id": "20e5086a-832a-43a6-87c9-6784e2d1e4bd",
  "function_version_id": "ba4e628b-975b-4e28-9e06-492016a94ec7",
  "title": "USD Validate",
  "description": "USD Validate 2024.1.0 aims to apply laser focus by primarily targeting developers at ISVs who want to build and deploy configurations. To satisfy this need, the functionality and available extensions have been reduced to serve this need.",
  "version": "2024.1.0",
  "image": "https://launcher-prod.s3.us-east-2.amazonaws.com/create/2023.2.5/image.png",
  "icon": "https://launcher-prod.s3.us-east-2.amazonaws.com/create/2023.2.5/icon.png",
  "category": "Template Applications",
  "product_area": "Omniverse"
}'
```

Get all published applications:

```bash
curl -X 'GET' \
  'http://127.0.0.1:8000/apps/' \
  -H 'Accept: application/json'
```

Get information about `usd-validate` app:

```bash
curl -X 'GET' \
  'http://127.0.0.1:8000/apps/usd-validate' \
  -H 'Accept: application/json'
```

Delete information about `usd-validate` app:
```bash
curl -X 'DELETE' \
  'http://127.0.0.1:8000/apps/usd-validate' \
  -H 'Accept: */*'
```


### Tests

To run Python tests, use the `poetry run pytest` command.