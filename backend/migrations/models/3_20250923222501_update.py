from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "published_page" (
            "name" VARCHAR(150) NOT NULL PRIMARY KEY,
            "order" SMALLINT
        );
        
        INSERT INTO published_page ("name", "order")
        SELECT DISTINCT "page" "name", NULL "order" FROM "published_app";
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "published_page";
    """
