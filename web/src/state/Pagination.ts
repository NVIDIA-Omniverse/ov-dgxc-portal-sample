import { z } from "zod";

import { fromSnakeCaseSchema } from "../util/Schemas";


/**
 * Creates a Zod schema for validating paginated API responses.
 * Accepts the schema for page items as a parameter.
 * @param itemSchema
 */
export function createPaginatedSchema<ItemType extends z.ZodTypeAny>(
  itemSchema: ItemType,
) {
  return fromSnakeCaseSchema(
    z.object({
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number(),
      totalSize: z.number(),
      items: z.array(itemSchema),
    }),
  );
}