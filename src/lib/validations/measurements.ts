import * as yup from 'yup';

// ---------------------------------------------------------------------------
// MeasurementResult discriminated union (FHIR R4 Observation.value[x])
// ---------------------------------------------------------------------------
const quantityValue = yup.object({
  value: yup.number().required(),
  unit: yup.string().required(),
  comparator: yup.string().oneOf(['<', '<=', '>=', '>']).optional(),
});

const codedValue = yup.object({
  code: yup.string().required(),
  system: yup.string().optional(),
  display: yup.string().optional(),
});

const rangeValue = yup.object({
  low: quantityValue.optional(),
  high: quantityValue.optional(),
});

const ratioValue = yup.object({
  numerator: quantityValue.optional(),
  denominator: quantityValue.optional(),
});

const measurementResult = yup.object({
  type: yup
    .string()
    .oneOf([
      'quantity',
      'coded',
      'absent',
      'range',
      'ratio',
      'sampledData',
      'period',
      'string',
      'time',
      'dateTime',
      'boolean',
      'integer',
    ])
    .required(),
  value: yup.mixed().required(),
});

// ---------------------------------------------------------------------------
// A single measurement value component
// ---------------------------------------------------------------------------
const measurementValueInput = yup.object({
  componentKey: yup.string().required(),
  result: measurementResult.required(),
  interpretation: yup.array().optional(),
  referenceRanges: yup.array().optional(),
});

// ---------------------------------------------------------------------------
// A single observation inside a group
// ---------------------------------------------------------------------------
const observationInput = yup.object({
  definitionSlug: yup.string().required(),
  observedAt: yup.string().required(), // ISO 8601
  values: yup.array().of(measurementValueInput).min(1).required(),
  notes: yup.string().optional(),
  method: yup.string().optional(),
  bodySite: yup.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/measurements/group — the creation payload
// ---------------------------------------------------------------------------
export const createMeasurementGroupSchema = yup.object({
  source: yup.string().oneOf(['manual', 'ai']).default('manual'),
  observedAt: yup.string().optional(), // default for all observations
  notes: yup.string().optional(), // group-level notes
  messages: yup
    .array()
    .of(
      yup.object({
        role: yup.string().oneOf(['user', 'assistant', 'system']).required(),
        content: yup.string().required(),
        timestamp: yup.string().optional(),
      }),
    )
    .optional(),
  sourceMessageId: yup.string().optional(),
  observations: yup.array().of(observationInput).min(1).required(),
});

export type CreateMeasurementGroupInput = yup.InferType<typeof createMeasurementGroupSchema>;

// ---------------------------------------------------------------------------
// PUT /api/measurements/[id] — amend a single measurement
// ---------------------------------------------------------------------------
export const updateMeasurementSchema = yup.object({
  observedAt: yup.string().optional(),
  status: yup.string().oneOf(['final', 'amended', 'entered-in-error']).optional(),
  notes: yup.string().optional(),
  method: yup.string().optional(),
  bodySite: yup.string().optional(),
  values: yup.array().of(measurementValueInput).min(1).optional(),
});

export type UpdateMeasurementInput = yup.InferType<typeof updateMeasurementSchema>;

// ---------------------------------------------------------------------------
// GET /api/measurements query params
// ---------------------------------------------------------------------------
export const listMeasurementsSchema = yup.object({
  definitionSlug: yup.string().optional(),
  from: yup.string().optional(), // ISO 8601
  to: yup.string().optional(),
  limit: yup.number().integer().min(1).max(100).default(50),
  offset: yup.number().integer().min(0).default(0),
});

export type ListMeasurementsQuery = yup.InferType<typeof listMeasurementsSchema>;
