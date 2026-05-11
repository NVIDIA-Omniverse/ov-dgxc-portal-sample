# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "mcp_access_token" (
    "client_id" VARCHAR(128) NOT NULL,
    "scopes" JSON NOT NULL,
    "expires_at" REAL NOT NULL,
    "subject" VARCHAR(256),
    "user_id_token" TEXT NOT NULL,
    "user_access_token" TEXT,
    "user_payload" JSON NOT NULL,
    "token" VARCHAR(128) NOT NULL PRIMARY KEY
) /* A broker-issued access token validated on MCP requests. */;
        CREATE TABLE IF NOT EXISTS "mcp_auth_code" (
    "client_id" VARCHAR(128) NOT NULL,
    "scopes" JSON NOT NULL,
    "expires_at" REAL NOT NULL,
    "subject" VARCHAR(256),
    "user_id_token" TEXT NOT NULL,
    "user_access_token" TEXT,
    "user_payload" JSON NOT NULL,
    "code" VARCHAR(128) NOT NULL PRIMARY KEY,
    "code_challenge" VARCHAR(256) NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "redirect_uri_provided_explicitly" INT NOT NULL,
    "resource" TEXT
) /* A broker-issued authorization code exchanged for tokens at /token. */;
        CREATE TABLE IF NOT EXISTS "mcp_auth_transaction" (
    "id" VARCHAR(128) NOT NULL PRIMARY KEY,
    "client_id" VARCHAR(128) NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "redirect_uri_provided_explicitly" INT NOT NULL,
    "code_challenge" VARCHAR(256) NOT NULL,
    "scopes" JSON NOT NULL,
    "client_state" TEXT,
    "resource" TEXT,
    "expires_at" REAL NOT NULL
) /* An in-flight brokered login awaiting the identity provider redirect. */;
        CREATE TABLE IF NOT EXISTS "mcp_oauth_client" (
    "client_id" VARCHAR(128) NOT NULL PRIMARY KEY,
    "client_info" JSON NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) /* A dynamically registered MCP OAuth client (RFC 7591). */;
        CREATE TABLE IF NOT EXISTS "mcp_refresh_token" (
    "client_id" VARCHAR(128) NOT NULL,
    "scopes" JSON NOT NULL,
    "expires_at" REAL NOT NULL,
    "subject" VARCHAR(256),
    "user_id_token" TEXT NOT NULL,
    "user_access_token" TEXT,
    "user_payload" JSON NOT NULL,
    "token" VARCHAR(128) NOT NULL PRIMARY KEY
) /* A broker-issued refresh token exchanged for new tokens. */;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "mcp_oauth_client";
        DROP TABLE IF EXISTS "mcp_auth_code";
        DROP TABLE IF EXISTS "mcp_refresh_token";
        DROP TABLE IF EXISTS "mcp_access_token";
        DROP TABLE IF EXISTS "mcp_auth_transaction";"""


MODELS_STATE = (
    "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"
    "nOf/ARj1L0k="
)
