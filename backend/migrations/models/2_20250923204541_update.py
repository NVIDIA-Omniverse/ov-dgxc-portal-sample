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
        ALTER TABLE "published_app" ADD "page" VARCHAR(150) NOT NULL DEFAULT "";
        UPDATE "published_app" SET page = category;
        ALTER TABLE "published_app" DROP COLUMN "image";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "published_app" ADD "image" VARCHAR(255) NOT NULL;
        ALTER TABLE "published_app" DROP COLUMN "page";"""


MODELS_STATE = (
    "eJztmm1vozgQx79KxKue1Ks2adNd3bu0TW9z2yarltyttqqQgx1iFQxrzLbRKt99x4RHB1"
    "CoyDbc5l0Yz4Dn5zG2/+GH5riY2P7J52BmU39B8MDzbqVJ+6vzQ2PIIfCj3Om4oyHPS12k"
    "QaCZHUZ5sbshfaTrzBccmQIa58j2CZgw8U1OPUFdBlYW2LY0uiY4UmalpoDRbwExhGsRsS"
    "AcGh4etHnATBlpUCxvn1x+J9yPzI+P0EAZJi/El0Hy0nsy5pTYOJdidAtpN8TSC22XC8Sv"
    "Q0/ZqZlhunbgsNTbW4oFPCZ2hz5Lq0UY4UgQnElTZhFhiU3rjMAgeECSTuLUgMkcBbbIYN"
    "mSlekyyZky4YcpOujFsAmzxAIue+/erdbZpLmu3WQK/w7uLj8O7o7A6w+ZiwvDtR7McdTU"
    "W7etwpsggda3CdmmMH07sOrgjP2bARobUqJpte0CaXcrpN0KpN0YaYpQre0cyel0dFVMUg"
    "lTgAYBxScyeD+xVlAMEZ6ehwQ91xcWDxtDEmXkMq+B1xDMh/+OJAUVkECNeZwEHCZyAjHb"
    "sw2UOnkRxSiVsLYAreCnD7/ostOO73+zs9iObgdfQqLOMmq5mYz/jt0zmC9vJhcK3WiS1i"
    "nSTEhbqObLtL9NlfbLi7S/UaPULEI45XbJ7scsxOctMWKCmuDJyYmRv4Sb7SfbbXZD/b5K"
    "zENWrTdj7N/OiutuVXLdiprrbhadCQlbLl/WwZiNOaBMq5G7ODCFgThBtapSiTsgTZGmh1"
    "exifQKcAjqkBKsSqyCFUfBJ/GPLSBHZ8JfyRhqAk+YvYyeXrWyj26H9/rg9nNueb8a6EPZ"
    "0sst7bH16FwZjeQmnf9G+seOvOx8nYyH6j418dO/arJPKBCuwdxnA+HM4Tm2xmByYwuNCy"
    "KXJhRu9MNxqTFrSsJfNXleM67aOMKyv5teh2CKDJ9w2GzVQavG/TKmjUos/f62m4oSogUb"
    "jjUZz+UFb6MRKzlE5IMUmND5/YRpyef82euevT/7cHp+9gFcwq4klvcVeEdjHchJmW/+lN"
    "GmpGGGzKdnxLGRa8moVsSXBwN/E/BFFHn96Y7YqORMFomk9+u7JPro3vFdxVUSW+MXvGTk"
    "9twyaptNTs9RLYjBRhdHz5ZPKqJSIC2r1MpV5WiUmteTD0rxGyjFB5nzIHO+NUn23ZwbnE"
    "CnfVFIsXx2F4S2cstyer7FVD9Vt+zpTJdNeagBbOJqwsyEtPMg2uAbUwEZXtRFGQcdYKZb"
    "PIFEULDBq/hrMonYFcadLuLNa8UAhAtDShd1ZZF8ZAOiyFvU6P9XFSEMv2pYs3GtVLpaMo"
    "Zx2tXSlufVXHXTiFbuXBpbJjYkgxzUTaLXLifUYp/IMuQ6gj4iZhbNgqqvp/aObpk6AGaO"
    "npPjcKZsIFNIhogw1/uh3hlPb260VbniskudYUA4NRdagcIQtRxXaQso9dkbaaFU3CuctA"
    "WiXjR6byosNCDpHVeoCL/jVwA7UZkL33SVa0d7Ae7kjw94oiCsQKP/534yLvlPOw1RQE4Z"
    "JPiAqSmOO7B0iMf9xFpBUWad2zptfPOjft6j7InkDS7qCfrNLy+rn+pphQE="
)
