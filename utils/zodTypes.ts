import { z } from "zod";

export const zodYear = z.number().gte(1000).lte(new Date().getFullYear());

export const zodYearOptional = z
  .number()
  .gte(1000)
  .lte(new Date().getFullYear())
  .or(z.nan())
  .optional()
  .nullable();

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
export function getZodOptionFromEnum(enumObj: Record<string, string>) {
  return z.object({
    value: z.nativeEnum(enumObj),
    label: z.string(),
  });
}

export const zodPositiveNumber = z.number().positive();
