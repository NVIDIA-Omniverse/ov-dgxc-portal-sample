from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "published_app" ADD "page" VARCHAR(150) NOT NULL DEFAULT "";
        UPDATE "published_app" SET page = category;
        ALTER TABLE "published_app" DROP COLUMN "image";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "published_app" ADD "image" VARCHAR(255) NOT NULL;
        ALTER TABLE "published_app" DROP COLUMN "page";"""
