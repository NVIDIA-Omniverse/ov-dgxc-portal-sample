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
        ALTER TABLE "published_app" ADD "media_server" VARCHAR(255);
        ALTER TABLE "published_app" ADD "media_port" INT;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "published_app" DROP COLUMN "media_server";
        ALTER TABLE "published_app" DROP COLUMN "media_port";"""


MODELS_STATE = (
    "eJztmm1vmzoUx79KxKtO6qolbbrpvkvb9C5bm0wtuZtWVcjBDrEKhhnTNpry3WcTHo1BoS"
    "JruM27cHwO+Pzsg+0/+a05LkS2f/QtmNnYXyA48LxrYdL+6fzWCHAQ/1HudNjRgOelLsLA"
    "wMwOo7zY3RA+wnXmMwpMxhvnwPYRN0HkmxR7DLuEW0lg28LomtwREys1BQT/CpDBXAuxBa"
    "K84e5OmwfEFJEGhuL2yeUjon5kvr/nDZhA9Ix8ESQuvQdjjpENcylGtxB2gy290Ha+APQy"
    "9BSdmhmmawcOSb29JVvwx8TuvM/CaiGCKGAIZtIUWURYYtM6I25gNEBJJ2FqgGgOAptlsG"
    "zIynSJ4IwJ88MUHfBs2IhYbMEvex8+rNbZpLmu3UQK/w1uzj8Pbg641zuRi8uHaz2Y46ip"
    "t25bhTcBDKxvE7JNYfp2YNXBGfs3AzQ2pETT2bYNpN2NkHYrkHZjpClCeW7nSE6nows1SS"
    "lMAhoEGB6J4N3EWkExRHh8GhL0XJ9ZNGwMSZSRy7wGXkIwH/4WSTLMeAI16jgJ2BdyAjHb"
    "swJKHT0zNUoprC1AK/jpwx+66LTj+7/sLLaD68GPkKizjFquJuN/Y/cM5vOryZlENyrSOp"
    "M0E9IWqvlp2t9klvbLJ2m/MEexAyxFoU+pXbL9if0lgN4SAsKwyV0pOjLyl/xuu0l3k/1Q"
    "v19gZqqmXTkyUznl3hIxk+dguXRZp1izMe2s1u5G5dqtqNdusWA96sLAZAagCNTBKcftka"
    "ZI09MqKyK94DgYdlAJVilWwgqj4KP4xwaQo0Pg32TM5wScEHsZPb1qKR9dD2/1wfW33Hp+"
    "MdCHoqWXW8tj68GpNBrJTTrfR/rnjrjs/JyMh/LGNPHTf2qiTyBgrkHcJwPAzGk5tsZgcm"
    "PLGxdIvFdBuLMPx6VG1ZSEv6h4XjKu2jjCsru7XAdBDAwfUb67qoNWjvtrTBvVVPr9TVfE"
    "EqKK1XJNxnOp4m00IiWnhnyQBJN3fjdhWuI573vdk48nn45PTz5xl7ArieVjBd7RWOfkhK"
    "43f8iIUcIwA+bDE6DQyLVkZCrki5OAXwR8FkVefr1BNig5hEWq6O36LokgunN8V/Esia3x"
    "C14wcntuGbVik9NzZAsg/CgAo2eLJ6moKLRkmVq5jByNUvMC8l4afgVpeK9r7nXN1yZJHs"
    "25QRHvtM+UFMurWxHayi3L8ekGpX4sb9nTShdNeagB38TVhJkJaedBtME3pgQyvKiLMg7a"
    "w0y3eAywQLHBq/gWmURsC+NWF/HmxWEOhDJDSBd1ZZF8ZAOiyGvM0f+vKoIIfNGwZuNaqX"
    "S1ZAzjtKulLc+rueqmEa3cuTS2TBQkgxzUItFLlyJska9oGXId8T4CYqqqoOrvUjtHt0wd"
    "4GYKnpLjcGba8Ex5MoiFud4O9c54enWlrcoVl23qDANEsbnQFApD1HJYpS2A1GdnpIVScU"
    "9ZtApRLxq9VxUWGpD0DitUhLf42X8rKrPyTVe5drQX4FY+fPAnMkQUGv2X28m45Jt2GiKB"
    "nBKe4B3EJjvs8KWD3e8m1gqKIuvc1qnwJx/5/zzSnkjc4KyeoN/88rL6AzpohHg="
)
