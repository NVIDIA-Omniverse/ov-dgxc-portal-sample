/*
 * SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
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

import { Navigate, NavLink, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authenticate } from "@omniverse/auth/react/SSO";
import useNucleusSession from "@omniverse/auth/react/hooks/NucleusSession";
import { Button, Loader, Stack } from "@mantine/core";
import LoaderError from "../components/LoaderError";

/**
 * Accepts single sign on results for Nucleus authentication and
 * sends them to the Nucleus server using @omniverse/auth libraries.
 *
 * Nucleus puts the application state saved before the SSO redirect as the first parameter after the path,
 * e.g. /sso/:state.
 *
 * Other fields required for the login are specified in query parameters.
 */
export default function NucleusSSO() {
  const location = useLocation();
  const { state } = useParams<{ state: string }>();
  const session = useNucleusSession();

  const {
    isLoading,
    isError,
    data: redirectAfter = "/",
    error,
  } = useQuery({
    queryKey: ["nucleus/sso", location.search],
    queryFn: async () => {
      if (!state) {
        throw new Error("SSO params are not specified.");
      }

      const result = await authenticate(state, location.search);
      if (result.server && result.accessToken && result.refreshToken) {
        session.setSession({
          server: result.server,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
      } else if (result.errors) {
        throw new Error(result.errors.join("\n"));
      }

      return result.extras?.redirectAfter ?? "/";
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
    staleTime: 0,
    enabled: !!state,
  });

  if (isLoading) {
    return <Loader m={"md"} />;
  }

  if (isError) {
    return (
      <LoaderError title={"Failed to authenticate"}>
        <Stack>
          <p>{error.toString()}</p>
          <Button component={NavLink} to="/">
            Go back
          </Button>
        </Stack>
      </LoaderError>
    );
  }

  return <Navigate to={redirectAfter} />;
}
