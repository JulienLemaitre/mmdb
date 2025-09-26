import { z } from "zod";

export const zodYear = z.coerce
  .number<string>()
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

// Get values from enum
export function getValues<T extends Record<string, any>>(obj: T) {
  return Object.values(obj) as [(typeof obj)[keyof T]];
}

// Generic option schema that preserves enum type using nativeEnum
export function getZodOptionFromEnum<T extends Record<string, string>>(
  enumObj: T,
) {
  return z.object({
    value: z.enum(getValues(enumObj)),
    label: z.string(),
  });
}

export const zodPositiveNumber = z.coerce.number<string>().positive();
export const zodPositiveNumberOrEmpty = z
  .union([z.literal(""), z.coerce.number().positive()])
  .transform((val) => (val === "" ? null : val)); // Convert empty string to null
