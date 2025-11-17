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

FROM node:20-alpine AS build

# Install project dependencies
WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install --ignore-scripts

# Build the project
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:bookworm AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY ATTRIBUTIONS.md .

EXPOSE 8080

# Must provide nginx.conf file to the volume to configure nginx
VOLUME "/etc/nginx/config/"
VOLUME "/usr/share/nginx/html/config/"

USER nginx

CMD ["nginx", "-c", "/etc/nginx/config/nginx.conf", "-g", "daemon off;"]
