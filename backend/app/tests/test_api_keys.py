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

import asyncio
from unittest.mock import patch

import pytest

from app.api_keys import ApiKey, ApiKeys


@pytest.fixture
def temp_api_keys_file(tmp_path):
    api_keys_file = tmp_path / "api-keys.toml"
    yield api_keys_file


@pytest.fixture
def valid_toml_content():
    return """
[[keys]]
name = "key1"
value = "value1"

[[keys]]
name = "key2"
value = "value2"
"""


@pytest.fixture
def api_keys_with_env(temp_api_keys_file, monkeypatch):
    monkeypatch.setenv("API_KEYS_PATH", str(temp_api_keys_file))
    import importlib
    import app.api_keys
    importlib.reload(app.api_keys)
    yield
    monkeypatch.delenv("API_KEYS_PATH", raising=False)


@pytest.fixture
def api_keys_with_watch_setup(temp_api_keys_file, monkeypatch):
    temp_api_keys_file.write_text('[[keys]]\nname = "key1"\nvalue = "value1"')
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    monkeypatch.setattr("app.settings.settings.watch_interval", 0.1)
    
    return ApiKeys.read()


def test_load_valid_api_keys(temp_api_keys_file, valid_toml_content, monkeypatch):
    temp_api_keys_file.write_text(valid_toml_content)
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 2
    assert api_keys.keys[0].name == "key1"
    assert api_keys.keys[0].value == "value1"
    assert api_keys.keys[1].name == "key2"
    assert api_keys.keys[1].value == "value2"


def test_load_keys_from_nonexistent_file(temp_api_keys_file, monkeypatch):
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 0


def test_load_keys_with_invalid_toml(temp_api_keys_file, monkeypatch):
    temp_api_keys_file.write_text("invalid toml content [[[")
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 0


def test_load_keys_with_invalid_format_not_array(temp_api_keys_file, monkeypatch):
    temp_api_keys_file.write_text('keys = "not-an-array"')
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 0


def test_load_keys_with_missing_name(temp_api_keys_file, monkeypatch):
    content = """
[[keys]]
value = "value1"

[[keys]]
name = "key2"
value = "value2"
"""
    temp_api_keys_file.write_text(content)
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 1
    assert api_keys.keys[0].name == "key2"


def test_load_keys_with_missing_value(temp_api_keys_file, monkeypatch):
    content = """
[[keys]]
name = "key1"

[[keys]]
name = "key2"
value = "value2"
"""
    temp_api_keys_file.write_text(content)
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 1
    assert api_keys.keys[0].name == "key2"


def test_load_keys_with_invalid_key_format(temp_api_keys_file, monkeypatch):
    content = """
keys = ["not-a-dict"]
"""
    temp_api_keys_file.write_text(content)
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    assert len(api_keys.keys) == 0


def test_is_valid_key_with_matching_key():
    api_keys = ApiKeys(keys=[
        ApiKey(name="key1", value="secret1"),
        ApiKey(name="key2", value="secret2"),
    ])
    
    result = api_keys.is_valid_key("secret1")
    
    assert result is not None
    assert result.name == "key1"
    assert result.value == "secret1"


def test_is_valid_key_with_non_matching_key():
    api_keys = ApiKeys(keys=[
        ApiKey(name="key1", value="secret1"),
    ])
    
    result = api_keys.is_valid_key("invalid")
    
    assert result is None


def test_is_valid_key_with_empty_keys():
    api_keys = ApiKeys(keys=[])
    
    result = api_keys.is_valid_key("anything")
    
    assert result is None


async def test_watch_detects_file_changes(temp_api_keys_file, api_keys_with_watch_setup):
    api_keys = api_keys_with_watch_setup
    assert len(api_keys.keys) == 1
    
    api_keys.listen()
    await asyncio.sleep(0.05)
    
    temp_api_keys_file.write_text('[[keys]]\nname = "key1"\nvalue = "value1"\n\n[[keys]]\nname = "key2"\nvalue = "value2"')
    await asyncio.sleep(0.25)
    
    assert len(api_keys.keys) == 2
    
    api_keys.stop()
    await asyncio.sleep(0.05)


async def test_watch_handles_file_removal(temp_api_keys_file, api_keys_with_watch_setup):
    api_keys = api_keys_with_watch_setup
    assert len(api_keys.keys) == 1
    
    api_keys.listen()
    await asyncio.sleep(0.05)
    
    temp_api_keys_file.unlink()
    await asyncio.sleep(0.25)
    
    assert len(api_keys.keys) == 0
    
    api_keys.stop()
    await asyncio.sleep(0.05)


async def test_listen_only_starts_once(temp_api_keys_file, monkeypatch):
    temp_api_keys_file.write_text('[[keys]]\nname = "key1"\nvalue = "value1"')
    monkeypatch.setattr("app.api_keys.api_keys_path", str(temp_api_keys_file))
    
    api_keys = ApiKeys.read()
    
    api_keys.listen()
    api_keys.listen()
    api_keys.listen()
    
    api_keys.stop()
    await asyncio.sleep(0.1)


async def test_watch_handles_read_errors(api_keys_with_watch_setup):
    api_keys = api_keys_with_watch_setup
    original_key_count = len(api_keys.keys)
    
    api_keys.listen()
    
    with patch("builtins.open", side_effect=IOError("Permission denied")):
        await asyncio.sleep(0.2)
    
    assert len(api_keys.keys) == original_key_count
    
    api_keys.stop()
    await asyncio.sleep(0.1)


def test_empty_keys_list():
    api_keys = ApiKeys(keys=[])
    
    assert len(api_keys.keys) == 0
    assert api_keys.is_valid_key("anything") is None


def test_multiple_keys_with_same_name():
    api_keys = ApiKeys(keys=[
        ApiKey(name="duplicate", value="value1"),
        ApiKey(name="duplicate", value="value2"),
    ])
    
    result = api_keys.is_valid_key("value1")
    assert result is not None
    assert result.value == "value1"
    
    result = api_keys.is_valid_key("value2")
    assert result is not None
    assert result.value == "value2"

