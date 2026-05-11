# Omniverse on DGX Cloud Portal Sample (Customer Backend)

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

![streaming-publishing.png](/docs/images/streaming-publishing.png)

Web applications can utilize the Customer Backend to display NVCF functions as streamable applications:

![streaming-list.png](/docs/images/streaming-list.png)

This service is also acts as an intermediary proxy and a message broker between the web frontend and Kit-based 
applications deployed on NVCF. The web frontend establishes a WebSocket connection to this backend service which 
verifies that the user is authenticated and authorized to establish a stream. The service injects Starfleet API Key 
to the WebSocket request and forwards it to the specified NVCF function to establish a signaling channel for starting 
a stream:

![streaming-join.png](/docs/images/streaming-join.png)

## Prerequisites

* [Python 3.12](https://www.python.org/downloads/) or above
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
add `root_path` to `settings.toml` file::

```toml
root_path = "/api"
```

To enable authentication, the following parameters must be provided in `settings.toml` file:

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

# The expected `iss` (issuer) claim value of accepted ID tokens.
# Per OpenID Connect Core 3.1.3.7, the issuer claim MUST be validated
# against the configured IdP. When omitted, the value advertised in the
# OpenID Connect discovery document (`issuer`) is used as a fallback.
# Set this explicitly in shared-IdP or multi-tenant deployments to prevent
# cross-tenant token acceptance.
issuer = "https://idp.example.com/"
```

Use `poetry run migrations` command to initialize the database.

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
  "page": "Template Applications",
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

To set the page order in the sidemenu displayed on the home page:
```bash
curl -X 'PUT' \
  'http://127.0.0.1:8000/pages/' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '[
    {"name": "Template Applications", "order": 1},
    {"name": "Test Applications", "order": 2},
  ]'
```

## MCP server (Model Context Protocol)

The backend can expose an embedded MCP server that lets AI agents such as Cursor
and Claude Code list, inspect, publish and remove streaming applications. It runs
in the same process as the backend and reuses the same database, NVCF integration
and identity provider. Publishing and removing applications requires membership in
the `admin_group`, exactly like the REST API.

Enable it in `settings.toml`:

```toml
mcp_enabled = true

# Public URL of the MCP endpoint, used as the OAuth resource identifier.
# It must be reachable by MCP clients and routed to the backend.
mcp_resource_url = "https://your-portal/mcp"

# Optional. Path where the MCP endpoint is mounted (default "/mcp").
mcp_path = "/mcp"

# Optional. OAuth scopes required to access the MCP endpoint.
mcp_required_scopes = []

# Confidential client the broker uses to log users in against the identity
# provider. Required when MCP is enabled and auth is not disabled.
mcp_upstream_client_id = "<idp client id>"
mcp_upstream_client_secret = "<idp client secret>"

# Optional. Scopes requested from the identity provider. Must be sufficient for
# group membership lookups used by the admin-only publish/remove tools.
mcp_upstream_scopes = ["openid", "profile", "email"]

# Optional. Path the identity provider redirects back to (default "/oauth/callback").
mcp_callback_path = "/oauth/callback"
```

### How authentication works

The backend embeds its own OAuth 2.1 authorization server and brokers the login
to the portal identity provider. This lets MCP clients run the standard browser
PKCE flow even though the identity provider does not advertise PKCE or Dynamic
Client Registration.

```
Cursor / Claude Code  -->  Backend MCP (authorization server)  -->  Identity provider
        ^  PKCE + DCR              |  confidential client                 |
        +--------------------------+  authorization code  <--------------+
```

1. The client discovers the resource metadata at
   `/.well-known/oauth-protected-resource{mcp_path}`, which points to the backend
   as the authorization server.
2. The client dynamically registers and starts the PKCE flow at the backend
   `/authorize` endpoint. The backend advertises `S256` and a registration
   endpoint, so no client configuration is needed.
3. The backend redirects the browser to the identity provider using the
   confidential client (`mcp_upstream_client_id` / `mcp_upstream_client_secret`).
4. The identity provider redirects back to `{host}{mcp_callback_path}`, the
   backend exchanges the upstream code, then issues its own opaque token to the
   client.
5. The client calls the MCP endpoint with that token. Publishing and removing
   applications additionally require membership in the `admin_group`.

The endpoints are served on the host root (not under `/api`). When deploying with
the Helm chart, set `config.mcp.enabled=true` and provide
`config.mcp.upstreamClientId` / `config.mcp.upstreamClientSecret`; the chart routes
`/mcp`, the OAuth metadata, `/authorize`, `/token`, `/register`, `/revoke` and the
callback to the backend automatically.

Registered clients, authorization codes and tokens are persisted in the database
via Tortoise (the `mcp_*` tables), so the flow works across multiple backend
replicas. Apply the schema with `poetry run migrations`.

### Identity provider client

Register a confidential client (authorization-code grant) with the identity
provider and allow the redirect URI `{host}{mcp_callback_path}`, for example
`https://your-portal/oauth/callback`. Use its credentials for
`mcp_upstream_client_id` and `mcp_upstream_client_secret`.

### Register with clients

Cursor (`mcp.json`):

```json
{
  "mcpServers": {
    "portal-apps": { "url": "https://your-portal/mcp" }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http portal-apps https://your-portal/mcp
```

Then trigger the connection and complete the browser login. No client ID or
callback configuration is required, since the backend handles registration and
PKCE itself.

### Migrations

To generate migrations for updated database models, use the `aerich migrate` command and then `poetry run migrations`.

### Tests

To run Python tests, use the `poetry run pytest` command.