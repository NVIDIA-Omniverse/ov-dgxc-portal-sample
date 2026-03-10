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

import { Group, Table, UnstyledButton } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from "@tabler/icons-react";
import { SortState } from "../state/Sorting";

interface SortableTableHeaderProps {
  label: string;
  field: string;
  sort: SortState;
  onSort: (field: string) => void;
  maw?: number;
  w?: number;
}

/**
 * A table header cell that toggles sort direction on click:
 * unsorted → ascending → descending → unsorted.
 */
export default function SortableTableHeader({
  label,
  field,
  sort,
  onSort,
  ...rest
}: SortableTableHeaderProps) {
  const isActive = sort.field === field;

  const icon = isActive ? (
    sort.direction === "asc" ? (
      <IconChevronUp size={14} />
    ) : (
      <IconChevronDown size={14} />
    )
  ) : (
    <IconSelector size={14} />
  );

  return (
    <Table.Th {...rest}>
      <UnstyledButton onClick={() => onSort(field)} style={{ width: "100%" }}>
        <Group gap={4} wrap="nowrap">
          {label}
          {icon}
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}