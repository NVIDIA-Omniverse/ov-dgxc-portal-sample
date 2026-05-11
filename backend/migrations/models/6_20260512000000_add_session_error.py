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
        ALTER TABLE "session" ADD "error" TEXT;
"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "session" DROP COLUMN "error";"""


MODELS_STATE = (
    "eJztmm1v4jgQgP8Kyqee1KsKFLq6b7Slt9zyUpWwu9qqikxsQtTEyTrOtmjFfz875NUkuY"
    "QNhdzyCTKecezHY3s8zk/JtCAynIsHd27ozhLBnm2PuEj6q/FTwsBE7E+20nlDArYdqXAB"
    "BXPDs7IDdYXrcNW5QwlQKStcAMNBTASRoxLdprqFmRS7hsGFlsoUdaxFIhfr312kUEtDdI"
    "kIK3h6khYuVrmlokNeffj4AxHHFz8/swIdQ/SGHG7EH+0XZaEjAya66FfB5Qpd2Z7sdgnI"
    "vafJGzVXVMtwTRxp2yu6ZK8J1FmbuVRDGBFAEYx1k/fCxxKINj1iAkpcFDYSRgKIFsA1aA"
    "xLQVaqhTlnHVPH66IJ3hQDYY0u2WPr8nK96U3U140a78Ln3uPtx97jGdP6g/fFYsO1Gcyx"
    "X9TalK29SgAFm2o8thFMx3C1MjgD/WqABoKIaORt+0DaLIS0mYO0GSCNEIq+nSA5mw3u0k"
    "kKZgJQ19XhBTc+Tqw5FD2E7a5H0LYcqhGv0CORRS62DOxCMGn+O5KkOmUdKDGPQ4PTRA4h"
    "xlu2hVJGbzQdpWBWF6A5/OT+V5k32nSc70Yc29mo99Ujaq78kuFk/HegHsN8O5zcCHT9SV"
    "rGSWMmdaGadNNOES/tZDtpZ8tHdTUN4YwYGdGPmorPXkGAqa4yTYIulOQjq+w42RaJhjod"
    "kZgNtFIrY6BfT49rFnK5Zo7PNbedTmUd1iyyKoMxbnNCGXkjsaCrUgUQBEp5pWB3QhohjQ"
    "6vdBvpHcNBdRNlYBVsBazQN74I/hSA7J8J35Mx8wk4wcbKf3vezj4Y9adyb/SQ2N7venKf"
    "l7QSW3sgPesKoxFW0vgykD82+GPj22TcF+PUUE/+JvE2AZdaCrZeFQBjh+dAGoBJjC0rXC"
    "K+NQEv0PfGpcSsyTDfafLsMq7S2MdyvEGviaAOFAcRFmyVQSvavRvTSlMsnU7RoCKDaErA"
    "sSFjWyRlNRrgjENE0kiAyRp/nDA1/p4/W82r66sP7e7VB6biNSWUXOfgHYxlRo6n+RYvsd"
    "wUF8yB+vIKCFQSJbGsFXL4wcDZBnzjW95/ekQGyDiT+UnS6aaWMD96dHzXgZcE0mCB54ys"
    "lpVFbbvIbJmiBGAW6EL/3fxNYur4gZX/d4I50jovlmEO4utqU8xFk8feb4llLtCvYwK5wm"
    "grO4FsEZi2cUxNYBiZq11oVK+Frt267oZrHH/IW96mo95wWHqN2+fMTqx3KXNaXA+zZ7O/"
    "/h5uGp/ugBIByq/dAZ0uME4XGIcmiX+oC4Ug1miHplLM2aK3TWt5GGl3C0z1tngYj2Y6L0"
    "pCddnxrCTMmEk9U0wVrpgCyLKhY8LoBDM6vFFA3ZSjW85HB6HFvjDudROv/haIASFU4UnJ"
    "sgnPpGUF6c5D+Oj/N9+JMNxpWON2tcxh12QMg27nDiJ0SZh5Kpj+i5vsdCbeaRpe/sIcrC"
    "D1l3B8QqyUNEL2VxehQU1ivff+3IId3kuGfpFFTZDuKVbZytYkoG4TvbcI0jX8Ca08rgPW"
    "RoDVtKU47+Pco6OblXxmYgJew5xMzG1YT1lnEN0kAPtyYzwbDqX1YZJdPUR0dSmlpLn8kv"
    "O8BBeIdI4mv5W5eaRO2pRtwx+9g2a3Ktk2slNZv+NHZnu5xExd6XL3jvoC3Mu9OnsjRTjl"
    "Cvif6WSc8clUZCKAnGHWwSeoq/S8wbYO+nycWHMo8l7nxzhiOCME5ryCm0Pfpaz/BelZjg"
    "w="
)
