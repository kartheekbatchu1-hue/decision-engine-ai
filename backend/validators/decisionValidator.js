import { z } from 'zod';

export const createDecisionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  domain: z.string().min(2, 'Domain is required'),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
  problem_statement: z.string().min(10, 'Provide a detailed problem statement'),
  alternatives: z.array(z.object({
    name: z.string().min(1, 'Alternative name required'),
    description: z.string().optional(),
    estimated_cost: z.number().nonnegative().optional().nullable(),
    time_to_implement_weeks: z.number().int().positive().optional().nullable(),
  })).min(2, 'At least 2 alternatives are required'),
  criteria: z.array(z.object({
    name: z.string().min(1, 'Criterion name required'),
    weight: z.number().int().min(1).max(10),
    is_maximize: z.boolean().default(true),
  })).min(1, 'At least 1 criterion is required'),
});

export const simulateDecisionSchema = z.object({
  criteria_weights: z.array(z.object({
    name: z.string(),
    weight: z.number().min(1).max(10),
  })).min(1),
  scores: z.array(z.object({
    alternative_name: z.string(),
    criteria_breakdown: z.array(z.object({
      criterion_name: z.string(),
      score_out_of_10: z.number().min(0).max(10),
    })),
  })),
});

export function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.validatedData = result.data;
    next();
  };
}

