import { z } from "zod";

export const zodYear = z.coerce
  .number()
  .gte(1000)
  .lte(new Date().getFullYear());

export const zodYearOptional = zodYear.or(z.nan()).optional().nullable();

export const zodPerson = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthYear: zodYear,
  deathYear: zodYearOptional,
});

export const zodOption = z.object({
  value: z.string(),
  label: z.string(),
});
export function getZodOptionFromEnum<T extends Record<string, string>>(
  enumObj: T,
) {
  return z.object({
    value: z.nativeEnum(enumObj) as z.ZodNativeEnum<T>,
    label: z.string(),
  });
}

export const zodPositiveNumber = z.coerce.number().positive();
export const zodPositiveNumberOrEmpty = z
  .union([z.literal(""), z.coerce.number().positive()])
  .transform((val) => (val === "" ? null : val)); // Convert empty string to null
