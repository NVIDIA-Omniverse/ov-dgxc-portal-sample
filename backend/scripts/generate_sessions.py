import argparse
import asyncio
import uuid

from tortoise import Tortoise

from app.models import SessionModel, SessionStatus


"""
This script generates test session data and saves it to the database.
It may be useful for creating data to test the dashboard UI.
"""


async def generate(count: int, status: SessionStatus = None):
    await initialize()
    try:
        for iteration in range(0, count):
            print(".", end="")

            if status is None:
                match iteration % 4:
                    case 0:
                        session_status = SessionStatus.active
                    case 1:
                        session_status = SessionStatus.stopped
                    case 2:
                        session_status = SessionStatus.connecting
                    case 3:
                        session_status = SessionStatus.idle
                    case _:
                        session_status = SessionStatus.stopped
            else:
                session_status = status

            await SessionModel.create(
                id=str(uuid.uuid4()),
                function_id=str(uuid.uuid4()),
                function_version_id=str(uuid.uuid4()),
                status=session_status,
                user="test-user"
            )
        print("\nDone.")
    finally:
        await Tortoise.close_connections()


async def initialize():
    print("Initialize the database.")

    await Tortoise.init(
        db_url='sqlite://db/db.sqlite3',
        modules={'models': ['app.models']}
    )
    await Tortoise.generate_schemas()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10, dest="count")
    parser.add_argument("--status", type=SessionStatus, dest="status")

    args = parser.parse_args()
    asyncio.run(generate(args.count, args.status))
