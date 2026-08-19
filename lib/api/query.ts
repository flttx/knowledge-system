import { ValidationError } from "@/lib/services/errors";

export function optionalEnum<T extends string>(
  value: string | null,
  values: readonly T[],
  field: string,
): T | undefined {
  if (value === null) {
    return undefined;
  }
  if (!values.includes(value as T)) {
    throw new ValidationError({ [field]: [`${field} 值无效。`] });
  }
  return value as T;
}

export function optionalNumber(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new ValidationError({ limit: ["数字参数无效。"] });
  }
  return numberValue;
}

export function optionalBoolean(value: string | null): boolean | undefined {
  if (value === null) {
    return undefined;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new ValidationError({ archived: ["布尔参数无效。"] });
}
