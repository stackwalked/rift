import { t, type Static, type TSchema } from "elysia";
import { TypeCompiler } from "elysia/type-system";

export { t };

export type EnvSource = Record<string, unknown>;
export type EnvSchema = TSchema & {
  properties: Record<string, TSchema>;
};

export type EnvValidationIssue = {
  path: string;
  message: string;
};

export class EnvValidationError extends Error {
  readonly issues: EnvValidationIssue[];

  constructor(issues: EnvValidationIssue[]) {
    super(
      `Invalid environment: ${issues
        .map(({ path, message }) => `${path}: ${message}`)
        .join("; ")}`,
    );

    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

type SchemaShape = TSchema & {
  anyOf?: TSchema[];
  const?: unknown;
  enum?: unknown[];
  items?: TSchema;
  oneOf?: TSchema[];
  properties?: Record<string, TSchema>;
  type?: string;
};

const coerce = (value: unknown, schema: TSchema): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const shape = schema as SchemaShape;
  const variants = shape.anyOf ?? shape.oneOf;

  if (variants) {
    for (const variant of variants) {
      const coerced = coerce(value, variant);
      const validator = TypeCompiler.Compile(variant);

      if (validator.Check(coerced)) {
        return validator.Decode(coerced);
      }
    }

    return value;
  }

  if (shape.const !== undefined || shape.enum) {
    return value;
  }

  switch (shape.type) {
    case "number":
      return toNumber(value, Number.isFinite);

    case "integer":
      return toNumber(value, Number.isInteger);

    case "boolean":
      return toBoolean(value);

    case "array":
      return toArray(value).map((item) =>
        shape.items ? coerce(item, shape.items) : item,
      );

    case "object":
      return shape.properties ? toObject(value, shape.properties) : value;

    case "null":
      return value.trim().toLowerCase() === "null" ? null : value;

    default:
      return value;
  }
};

const toNumber = (
  value: string,
  isValid: (value: number) => boolean,
): number | string => {
  const number = Number(value);

  return value.trim() !== "" && isValid(number) ? number : value;
};

const toBoolean = (value: string): boolean | string => {
  switch (value.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
    case "on":
      return true;

    case "false":
    case "0":
    case "no":
    case "off":
      return false;

    default:
      return value;
  }
};

const toArray = (value: string): unknown[] => {
  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Use comma-separated values when the value is not JSON.
  }

  return value.split(",").map((item) => item.trim());
};

const toObject = (
  value: string,
  properties: Record<string, TSchema>,
): Record<string, unknown> | string => {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return value;
    }

    return pickAndCoerce(parsed as Record<string, unknown>, properties);
  } catch {
    return value;
  }
};

const pickAndCoerce = (
  source: Record<string, unknown>,
  properties: Record<string, TSchema>,
): Record<string, unknown> => {
  const output: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(properties)) {
    const value = source[key];

    if (value !== undefined) {
      output[key] = coerce(value, property);
    }
  }

  return output;
};

export const validateEnv = <const Schema extends EnvSchema>(
  source: EnvSource,
  schema: Schema,
): Static<Schema> => {
  const env = pickAndCoerce(source, schema.properties);
  const validator = TypeCompiler.Compile(schema);

  if (validator.Check(env)) {
    return validator.Decode(env) as Static<Schema>;
  }

  throw new EnvValidationError(
    [...validator.Errors(env)].map((error) => ({
      path: error.path || "/",
      message: error.message,
    })),
  );
};
