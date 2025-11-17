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

from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "published_app" (
    "id" VARCHAR(200) NOT NULL PRIMARY KEY,
    "slug" VARCHAR(100) NOT NULL,
    "function_id" CHAR(36) NOT NULL,
    "function_version_id" CHAR(36) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(255) NOT NULL,
    "category" VARCHAR(150) NOT NULL,
    "product_area" VARCHAR(150) NOT NULL,
    "published_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "authentication_type" VARCHAR(100) DEFAULT 'NONE',
    CONSTRAINT "uid_published_a_functio_7bdc8f" UNIQUE ("function_id", "function_version_id")
);
CREATE TABLE IF NOT EXISTS "session" (
    "id" VARCHAR(200) NOT NULL PRIMARY KEY,
    "function_id" CHAR(36) NOT NULL,
    "function_version_id" CHAR(36) NOT NULL,
    "nvcf_request_id" VARCHAR(36),
    "user_id" VARCHAR(200) NOT NULL,
    "user_name" VARCHAR(200) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "start_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP,
    "app_id" VARCHAR(200) REFERENCES "published_app" ("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_session_status_d62a4a" ON "session" ("status");
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "eJztmm1v2joUgP8KyqdO6qpBSzftG23pHVsLUxvunVZVkYlNsJo4meOsRRP/fbaJ8+K8jF"
    "Swwi3fyPE5js9jn/j4mF+G50Pkhkdfo4mLwxmCvSC4FiLjY+uXQYCH+I9qpcOWAYIgVREC"
    "BiautAqUuiV0hOokZBTYjDdOgRsiLoIotCkOGPYJl5LIdYXQt7kiJk4qigj+ESGL+Q5iM0"
    "R5w92dMY2ILSwtDEX3yeNPRMNYfH/PGzCB6AmFwkg8Bg/WFCMX5lyMuxByi80DKTufAXop"
    "NcWgJpbtu5FHUu1gzmb8NUqdj1lIHUQQBQzBjJvCixiLEi094gJGI5QMEqYCiKYgclkGy4"
    "qsbJ8IzpiwULrogSfLRcRhM/7YefdusfQm9XWpJlz4t3dz/ql3c8C13ghffD5dy8kcxk2d"
    "ZdtCdgIYWHYj2aYwQzdymuBU+usBqgQp0XS1bQJpeyWk7RqkbYU0Raiv7RzJ8XhwUU5SM9"
    "OARhGGR8J4O7HWUJQIj08lwcAPmUNloyRRRS7zGXgOwbz5ayTJMOMONIjjxGAfyAnE7MgK"
    "KE30xMpRama7ArSGn9n/ZopBe2H4w81iO7jufZNEvXnccjUa/qPUM5jPr0ZnGt04SJss0o"
    "zJrlDNL9PuKqu0W71Iu4U1ij3glAT6mLoV6Y/S1wAGcwgIwzZXpejIyj/y3raT7ir5ULdb"
    "YGaXLbtqZHbpkntNxGzug+PTeZNgzdrsZrS2VwrXdk28tosBG1AfRjazAEWgCU7dbo80RZ"
    "qeVlkR6QXHwbCHKrBqthpWGBsfqR8rQI4PgX+TMV8TcETcefz2uq18cN2/NXvXX3P7+UXP"
    "7IuWTm4vV9KDU202kk5a/w3MTy3x2Po+Gvb1xDTRM78bYkwgYr5F/EcLwMxpWUkVmNzc8s"
    "YZEt9VIDN7OS8NoqbC/FnB85x5NYYxlu3KckUtZfqQKQAIwQTYD4+AQivXkikNoFBkX2GR"
    "/1lsefnlBrmgIvGNK1G3y16SItTWBdNCrSElVUElGPkdv4pascnreLoEEJ5+wfjd4k1lVE"
    "rqdzq16tJdPEvrL9rty3EvUI7b15L2taSXJkl+2lOLIj7okJVSrI7uEtO/tvWuM9aPT1cI"
    "9WM9TUojXTTloUYhog1hZkx2M/lf4xdTAykfmqJURnuYaYrHAItKErya+5/EYlMYN7qJr7"
    "8gx4FQZonjYtOjaN5yDQfRl1ij/9+TKCLwWdOatdvJ6sKOzKFyu76cEAQNd93UYiczl7Vt"
    "E4WSQQ5qkeilTxF2yBc0l1wHfIyA2GVRUPcXla2jW1Ud4GIKHpPjcGbZcE+5M4hJX2/7Zm"
    "s4vroyFtUVl03WGXqIYntmlFQY4pbDutoCSHW2prQwIBXXsKVBKyZMW1bx7L1oYcERb3nb"
    "aZ+8P/lwfHrygavIkSSS9zVBPBiaf6givMar1k63u+pdV9WHr3gPVvqlq907dhfgRv5Swd"
    "/IECm5pfl8OxpW3COmJhrIMeEO3kFss8MW3zrY/XZiraEovK7/Y4X+HwotJxIdnDUr6K9/"
    "e1n8BvUCtMM="
)
