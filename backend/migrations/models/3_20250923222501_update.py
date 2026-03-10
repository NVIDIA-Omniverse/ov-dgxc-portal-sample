# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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
        CREATE TABLE IF NOT EXISTS "published_page" (
            "name" VARCHAR(150) NOT NULL PRIMARY KEY,
            "order" SMALLINT
        );
        
        INSERT INTO published_page ("name", "order")
        SELECT DISTINCT "page" "name", NULL "order" FROM "published_app";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "published_page";"""


MODELS_STATE = (
    "eJztmm1v2joUgP8KyqdOYtWAQqf7jbZ0Y+OlKnA3raoiE5sQNXEyx1mLJv777LzHeblJLw"
    "yy8QlyfI5jPz62j4/zUzJMiHT7/M5Z6pq9RrBvWWMukv5p/JQwMBD7k6/UbEjAsiIVLqBg"
    "qbtWVqAucx2uurQpAQplhSug24iJILIVollUMzGTYkfXudBUmKKG1UjkYO27g2RqqoiuEW"
    "EFDw/SysEKt5Q1yKsPH38gYvvix0dWoGGIXpDNjfij9SSvNKTDRBf9KrhcphvLlV2vAbl1"
    "NXmjlrJi6o6BI21rQ9fsNYE6azOXqggjAiiCsW7yXvhYApHXIyagxEFhI2EkgGgFHJ3GsJ"
    "RkpZiYc9Ywtd0uGuBF1hFW6Zo9tt+923q9ifrqqfEu/Nu/v/7Yvz9jWm94X0w2XN5gTvyi"
    "tle2dSsBFHjVuGwjmLbuqFVwBvq7ARoIIqKRt+0DaasU0lYB0laANEIo+naC5GIxvMkmKZ"
    "gJQB1Hg+fc+DixFlB0EXZ6LkHLtKlK3EKXRB652DLwGoJJ87+RJNUo60CFeRwanCZyCDHe"
    "shTKOXqh2SgFs7oALeA3H3yd80Ybtv1dj2M7G/e/ukSNjV8ymk4+BOoxzNej6ZVA15+kVZ"
    "w0ZlIXqkk37Zbx0m6+k3ZTPqopWQgXRM+JfpRMfNYGAkw1hWkSdC4nH1llx8m2TDTU7YrE"
    "LKBWWhkD/Xp6XKuUy7UKfK6VdjqFdVg1yaYKxrjNCWXkjcSEjkJlQBCo5JWC3QlphDQ6vN"
    "I00huGg2oGysEq2ApYoW98HvwpAdk/E/5Oxswn4BTrG//tRTv7cDyYzfvju8T2ftOfD3hJ"
    "O7G1B9KznjAaYSWNL8P5xwZ/bHybTgZinBrqzb9JvE3AoaaMzWcZwNjhOZAGYBJjywrXiG"
    "9NwA303XGpMGtyzF81eV4zrtLEx3K8Qa+BoAZkGxEWbFVBK9r9NqY7TbF0u2WDihyiGQGH"
    "R8YyScZqNMQ5h4ikkQCTNf44Yar8PW/brYvLi/ed3sV7puI2JZRcFuAdTuaMHE/zrZ5iuS"
    "kuWALl6RkQKCdKYlkrZPODgZ0GfOVb3n6+RzrIOZP5SdKZV0uYHz06vtvASwJpsMBzRmbb"
    "zKOWLjLahigBmAW60H83f5OYOr5j5f+dYI60muUyzEF8vdsUc9nksftbYZkL9OuYQN5htJ"
    "WfQDYJzNo4ZgbQ9dzVLjSq10LXaV/2wjWOPxQtb7NxfzSqvMbtc2Yn1ruMOS2uh/mz2V9/"
    "DzeNT3dAiQDl/90BnS4wThcYhyaJfygrmSDWaJtmUizYotOmtTyMdHolpnpHPIxHM50XJa"
    "E67HhWEWbMpJ4pph2umALIqqFjwugEMzq8UUCdjKNbwUcHocW+MO51E9/9LRADQqjMk5JV"
    "E55Jyx2kOw/ho39uvhNh+KphjdvVModdkzEMul2ctLasirtuZFHLyGVn20TqoJyAmiZ6ax"
    "Kkqfgz2rhch6yNACtZs6Dou8ijo5uX92NiAp7D43DMbVhPWWcQ9XIvg3ljshiNpO1h8gx9"
    "RDRlLWVkGPySZlFuAUQ6R5NayE1kZU7ajCyWP3oHTSzsIFnfLMgi/I3f9+zl/ihzpSvcO+"
    "oLcC9XmuyNFOGM27dPs+kk52uVyEQAucCsgw9QU2izwbYO+nicWAso8l4nQqfU13zih3tC"
    "TMQruDp0Gnv7C7+uwtc="
)
