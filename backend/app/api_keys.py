import asyncio
import logging
import os
import sys
import tomllib
from dataclasses import dataclass, field
from typing import List

from app.settings import settings

logger = logging.getLogger("uvicorn.error")

api_keys_path = os.getenv("API_KEYS_PATH", "api-keys.toml")


@dataclass
class ApiKey:
    """Represents a single API key with name and value."""

    name: str
    value: str


@dataclass
class ApiKeys:
    """
    API keys loaded from the path specified in API_KEYS_PATH
    environment variable (api-keys.toml by default).

    The service watches file changes using the same interval as settings.
    """

    keys: List[ApiKey] = field(default_factory=list)

    __listening_task: asyncio.Task | None = field(default=None, init=False)

    @classmethod
    def read(cls):
        instance = cls()
        instance._load_keys()
        return instance

    def _load_keys(self):
        """Load API keys from the configured TOML file."""
        if not os.path.exists(api_keys_path):
            logger.info(f"API keys file {api_keys_path} does not exist.")
            self.keys = []
            return

        try:
            with open(api_keys_path, "rb") as file:
                data = tomllib.load(file)

            keys_data = data.get("keys", [])
            if not isinstance(keys_data, list):
                logger.error(
                    f"Invalid API keys format in {api_keys_path}: 'keys' must be an array."
                )
                self.keys = []
                return

            new_keys = []
            for key_data in keys_data:
                if not isinstance(key_data, dict):
                    logger.error(f"Invalid API key format: {key_data}")
                    continue

                name = key_data.get("name")
                value = key_data.get("value")

                if not name or not value:
                    logger.error(f"API key missing name or value: {key_data}")
                    continue

                new_keys.append(ApiKey(name=name, value=value))

            self.keys = new_keys
            logger.info(f"Loaded {len(self.keys)} API keys.")

        except (tomllib.TOMLDecodeError, IOError) as e:
            logger.error(f"Failed to read API keys from {api_keys_path}: {e}")
            self.keys = []

    def listen(self):
        """Start watching for API key changes using settings watch interval."""
        if self.__listening_task is not None:
            return

        async def _listen():
            last_content = ""
            if os.path.exists(api_keys_path):
                try:
                    with open(api_keys_path, "r") as file:
                        last_content = file.read()
                except IOError:
                    pass

            while True:
                await asyncio.sleep(settings.watch_interval)

                if not os.path.exists(api_keys_path):
                    if last_content:
                        logger.info("API keys file has been removed.")
                        self.keys = []
                        last_content = ""
                    continue

                try:
                    with open(api_keys_path, "r") as file:
                        content = file.read()

                    if content != last_content:
                        logger.info("API keys have been updated.")
                        self._load_keys()
                        last_content = content

                except IOError as e:
                    logger.error(f"Failed to read API keys file: {e}")

        self.__listening_task = asyncio.create_task(_listen())

    def stop(self):
        """Stop watching for API key changes."""
        if self.__listening_task is not None:
            self.__listening_task.cancel()

    def is_valid_key(self, key_value: str) -> ApiKey | None:
        """Get ApiKey object by its value, or None if not found."""
        for key in self.keys:
            if key.value == key_value:
                return key
        return None


if "pytest" in sys.modules:
    api_keys = ApiKeys(keys=[ApiKey(name="test-key", value="test-value")])
else:
    api_keys = ApiKeys.read()
