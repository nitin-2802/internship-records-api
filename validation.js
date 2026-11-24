import { z } from 'zod';

const MODES = ['Remote', 'Hybrid', 'On-site'];

export const createInternshipSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^INT-\d{3,}$/, 'ID must follow the format INT-XXX (e.g., INT-201)'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  domain: z.string().trim().min(2, 'Domain is required').max(80),
  mode: z.enum(MODES, {
    errorMap: () => ({ message: `Mode must be one of: ${MODES.join(', ')}` }),
  }),
  location: z.string().trim().min(2).max(80).default('India'),
  duration_weeks: z.number().int().min(1).max(52).default(4),
  skills: z.array(z.string().trim().min(1)).default([]),
  openings: z.number().int().min(0).max(500).default(1),
  applications_open: z.boolean().default(true),
});

export const updateInternshipSchema = createInternshipSchema
  .omit({ id: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(5),
  mode: z.enum(MODES).optional(),
  domain: z.string().trim().min(1).optional(),
  open: z
    .enum(['true', 'false'])
    .transform((val) => (val === 'true' ? 1 : 0))
    .optional(),
});

export function formatZodError(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
