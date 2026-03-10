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

import { Select } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import type { SyntheticEvent } from "react";
import { resolutionOptions } from "../state/StreamResolution";

export interface StreamResolutionSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StreamResolutionSelect({
  value,
  onChange,
}: StreamResolutionSelectProps) {
  return (
    <Select
      checkIconPosition="right"
      size="xs"
      data={resolutionOptions}
      value={value}
      allowDeselect={false}
      comboboxProps={{ withinPortal: true }}
      rightSection={<IconChevronDown size={12} />}
      styles={{
        root: { width: 140, flexShrink: 0 },
        input: {
          height: 22,
          minHeight: 22,
          fontSize: 8,
          paddingLeft: 6,
          paddingRight: 20,
        },
        option: { fontSize: 9 },
      }}
      onChange={(v) => v && onChange(v)}
      onClick={preventDefault}
    />
  );
}

function preventDefault(e: SyntheticEvent): void {
  e.preventDefault();
}
