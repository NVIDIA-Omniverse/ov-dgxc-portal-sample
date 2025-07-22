from tortoise import BaseDBAsyncClient


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
