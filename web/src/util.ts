import { camel, mapKeys } from "radash";
import { z } from "zod";

/**
 * Creates a new Zod schema from the specified schema that will
 * accept all fields in snake case notation and transform them to camel case.
 * @param schema
 */
export function fromSnakeCaseSchema<T extends z.ZodTypeAny>(
  schema: T,
) {
  return z
    .any()
    .transform((record) => mapKeys(record as Record<string, string>, camel))
    .pipe(schema);
}
