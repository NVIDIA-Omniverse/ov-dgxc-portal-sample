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

import type { User, UserManager } from "oidc-client-ts";
import { renewTokenWithLock } from "../../util/tokenRenewal";

export type TokenRefreshSource = "activated" | "renewed";
export type TokenRefreshedCallback = (discovery: string, accessToken: string, source: TokenRefreshSource) => Promise<void>;

/**
 * Encapsulates authentication state for a single Storage API discovery URL.
 *
 * Manages the UserManager instance, current user, and token renewal event listeners.
 * Notifies via callbacks when tokens are refreshed.
 */
export class StorageApiSession {
  private _user: User | null = null;
  private removeRenewalEvents: (() => void) | null = null;

  constructor(
    public readonly discovery: string,
    public readonly userManager: UserManager,
    private readonly onTokenRefreshed: TokenRefreshedCallback,
  ) {}

  get user(): User | null {
    return this._user;
  }

  get isAuthenticated(): boolean {
    return this._user !== null && !this._user.expired;
  }

  activate(user: User): void {
    if (this.removeRenewalEvents) {
      this.removeRenewalEvents();
    }

    const previousToken = this._user?.access_token;
    this._user = user;
    this.attachRenewalEvents();

    if (user.access_token !== previousToken) {
      void this.onTokenRefreshed(this.discovery, user.access_token, "activated");
    }
  }

  async renewToken(): Promise<void> {
    await renewTokenWithLock({
      lockName: `storageapi-renewal-${this.discovery}`,
      signinSilent: () => this.userManager.signinSilent(),
      onSuccess: (user) => {
        console.log(`Renewed token for ${this.discovery}`);
        this._user = user;
        void this.onTokenRefreshed(this.discovery, user.access_token, "renewed");
      },
      onFailure: async () => {
        console.log(`No user found for ${this.discovery}, falling back to interactive sign-in`);
        const user = await this.userManager.signinPopup();
        this._user = user;
        void this.onTokenRefreshed(this.discovery, user.access_token, "renewed");
      },
    });
  }

  dispose(): void {
    if (this.removeRenewalEvents) {
      this.removeRenewalEvents();
      this.removeRenewalEvents = null;
    }
    this._user = null;
  }

  private attachRenewalEvents(): void {
    const onExpiring = () => {
      console.log(`onExpiring for ${this.discovery}`);
      void this.renewToken();
    };
  
    const onSilentRenewError = (error: unknown) => {
      console.error(`Storage API silent renew error for ${this.discovery}:`, error);
    };

    console.log(`Attaching renewal events for storage API ${this.discovery}`);
    this.userManager.events.addAccessTokenExpiring(onExpiring);
    this.userManager.events.addSilentRenewError(onSilentRenewError);

    this.removeRenewalEvents = () => {
      this.userManager.events.removeAccessTokenExpiring(onExpiring);
      this.userManager.events.removeSilentRenewError(onSilentRenewError);
    };
  }
}
