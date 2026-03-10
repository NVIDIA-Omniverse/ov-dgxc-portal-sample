/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

import { Alert, Box, Button, Loader, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAuth } from "react-oidc-context";
import { Navigate, NavLink } from "react-router-dom";
import { AuthState } from "../components/AuthRequired.tsx";

export default function OpenId() {
  const auth = useAuth();

  if (auth.error && !auth.isLoading) {
    return (
      <Box p={"xl"}>
        <Alert
          variant="filled"
          color="red"
          title="Failed to authenticate"
          icon={<IconInfoCircle />}
        >
          <Stack align={"start"}>
            <Text size={"sm"}>{auth.error.message}</Text>
            <Button component={NavLink} to="/">
              Go back
            </Button>
          </Stack>
        </Alert>
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return <Loader />;
  } else {
    const state: AuthState = auth.user?.state ?? { redirectTo: "/" };
    const redirectTo = state.redirectTo ?? "/";
    return <Navigate to={redirectTo} />;
  }
}
