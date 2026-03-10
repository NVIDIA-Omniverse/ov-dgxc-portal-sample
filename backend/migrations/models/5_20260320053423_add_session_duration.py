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
        ALTER TABLE "session" ADD "duration" INT NOT NULL DEFAULT 0;
"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "session" DROP COLUMN "duration";"""


MODELS_STATE = (
    "eJztmm1zmzgQgP+Kh0/pTC5T27HTuW9O4lx99UsmxnedZjKMjGTMBAQVoomn4/9+EuZVvB"
    "RSXJurP9msdkF6tFqtFr5LpgWR4Vzcu0tDd9YIDmx7wkXSn63vEgYmYn/ylc5bErDtSIUL"
    "KFganpUdqCtch6suHUqASlnjChgOYiKIHJXoNtUtzKTYNQwutFSmqGMtErlY/+oihVoaom"
    "tEWMPjo7RyscotFR3y24eX3xBxfPHTE2vQMUSvyOFG/NJ+VlY6MmBiiP4tuFyhG9uT3awB"
    "ufM0eaeWimoZrokjbXtD1+wxgTrrM5dqCCMCKIKxYfJR+FgC0W5ETECJi8JOwkgA0Qq4Bo"
    "1hKclKtTDnrGPqeEM0watiIKzRNbvsvH+/3Y0mGutOjQ/hn8HDzcfBwxnTesfHYrHp2k3m"
    "1G/q7Nq23k0ABbvbeGwjmI7halVwBvr1AA0EEdHI2/aBtF0KabsAaTtAGiEUfTtBcrEY3W"
    "aTFMwEoK6rwwtufJxYCyh6CLt9j6BtOVQjXqNHIo9cLAy8hWDS/HckSXXKBlBhHYcGp4Uc"
    "Qoz3LIVSRq80G6Vg1hSgBfzk4WeZd9p0nK9GHNvZZPDZI2pu/JbxbPpXoB7DfDOeXQt0/U"
    "VaxUljJk2hmnTTXhkv7eU7aS/lo7qahXBBjJzsR83EZ28gwFRXmSZBF0rykt3sONmWyYZ6"
    "PZGYDbRKkTHQb6bHtUu5XLvA59ppp1PZgDWLbKpgjNucUEbeSCzoqlQBBIFKXinYnZBGSK"
    "PDK00jvWU4qG6iHKyCrYAV+sYXwZ8SkP0z4a9kzHwCzrCx8Z9etLOPJsO5PJjcJ7b324E8"
    "5C2dxNYeSM/6wmyEN2n9O5I/tvhl68tsOhTz1FBP/iLxPgGXWgq2XhQAY4fnQBqAScwta1"
    "wjvjUBL9H35qXCqskxf9Piecu8SlMfy/EmvSaCOlAcRFiyVQWtaPfLmNZaYun1yiYVOUQz"
    "Eo4dGdsiGdFohHMOEUkjASbr/HHC1Phz/ui0L68uP3T7lx+YiteVUHJVgHc0lRk5XuZbPc"
    "dqU1ywBOrzCyBQSbTEqlbI4QcDJw342re8+/SADJBzJvOLpPPdXcL66NHx3QZeEkiDAM8Z"
    "WR0rj1q6yeyYogRgluhC/9n8SWLp+J61/7jAHGmdl6swB/l1vSXmssVj77dCmAv0m1hArj"
    "Hbyi8gWwRmbRxzExhGbrQLjZoV6Lqdq34Y4/hFUXibTwbjceUYt8+VnYh3GWtajIf5q9mP"
    "v4dbxqd3QIkE5efeAZ1eYJxeYByaJP6mrhSCWKcdmkmxYItOmzbyMNLtl1jqXfEwHq103p"
    "SE6rLjWUWYMZNmlphqjJgCyKqpY8LoBDM6vFFA3YyjW8FHB6HFvjDudROv/y0QA0KowouS"
    "VQueScsayp2H8NH/b70TYfimaY3bNbKG3ZA5DIZdOInQJWHlqWT5L27SrDPxTxX/EqV+26"
    "6Yq0QWjcz3attcU+WFBNQ00TuLIF3Dn9DG4zpifQRYzYodRV+THh3dvGopExPwEhYRYm7D"
    "RsoGg+iuYjWUW9PFeCxtD1OdGSCiq2spoy7jt5wXVWRApHM0BZncaJe5aDPinD97By3H1B"
    "Ll8msvv+NXUXt565YZ6Qr3juYC3MuLYPZEinDGO8u/57Npzjc+kYkAcoHZAB+hrtLzFts6"
    "6NNxYi2gyEedSDhT30CKnzsKmSS/wfWhi//b/wBhIiSx"
)
