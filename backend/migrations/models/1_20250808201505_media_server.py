from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "published_app" ADD "media_server" VARCHAR(255);
        ALTER TABLE "published_app" ADD "media_port" INT;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "published_app" DROP COLUMN "media_server";
        ALTER TABLE "published_app" DROP COLUMN "media_port";"""
