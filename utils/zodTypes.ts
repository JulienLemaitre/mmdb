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
