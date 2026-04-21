import { isRedirectError } from "next/dist/client/components/redirect-error";

type EnumLike = Record<string, string>;

export class ValidationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ValidationError";
  }
}

export class StorageError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "StorageError";
  }
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

export function getActionErrorCode(error: unknown, fallback = "unexpected") {
  if (isValidationError(error) || isStorageError(error)) {
    return error.code;
  }

  return fallback;
}

export function rethrowRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

export function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export function getOptionalFormString(formData: FormData, key: string, maxLength?: number) {
  const value = getFormString(formData, key);
  if (!value) {
    return null;
  }

  if (maxLength && value.length > maxLength) {
    throw new ValidationError(`${key}-too-long`, `${key} is too long.`);
  }

  return value;
}

export function requireFormString(
  formData: FormData,
  key: string,
  options?: {
    maxLength?: number;
    minLength?: number;
  },
) {
  const value = getFormString(formData, key);
  if (!value) {
    throw new ValidationError(`missing-${key}`, `${key} is required.`);
  }

  if (options?.minLength && value.length < options.minLength) {
    throw new ValidationError(`${key}-too-short`, `${key} is too short.`);
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw new ValidationError(`${key}-too-long`, `${key} is too long.`);
  }

  return value;
}

export function parseBooleanField(formData: FormData, key: string) {
  return String(formData.get(key) || "false") === "true";
}

export function parseIntegerField(
  formData: FormData,
  key: string,
  options: {
    min?: number;
    max?: number;
    fallback?: number;
    optional: true;
  },
): number | null;
export function parseIntegerField(
  formData: FormData,
  key: string,
  options?: {
    min?: number;
    max?: number;
    fallback?: number;
    optional?: false;
  },
): number;
export function parseIntegerField(
  formData: FormData,
  key: string,
  options?: {
    min?: number;
    max?: number;
    fallback?: number;
    optional?: boolean;
  },
) {
  const raw = getFormString(formData, key);
  if (!raw) {
    if (options?.optional) {
      return null;
    }

    if (typeof options?.fallback === "number") {
      return options.fallback;
    }

    throw new ValidationError(`missing-${key}`, `${key} is required.`);
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new ValidationError(`invalid-${key}`, `${key} must be an integer.`);
  }

  if (typeof options?.min === "number" && value < options.min) {
    throw new ValidationError(`${key}-too-small`, `${key} is too small.`);
  }

  if (typeof options?.max === "number" && value > options.max) {
    throw new ValidationError(`${key}-too-large`, `${key} is too large.`);
  }

  return value;
}

export function parseEnumField<const T extends readonly string[]>(
  formData: FormData,
  key: string,
  enumLike: T,
): T[number];
export function parseEnumField<T extends EnumLike>(
  formData: FormData,
  key: string,
  enumLike: T,
): T[keyof T];
export function parseEnumField<T extends string>(
  formData: FormData,
  key: string,
  enumLike: EnumLike | readonly T[],
) {
  const value = requireFormString(formData, key);
  const allowed = Array.isArray(enumLike) ? enumLike : Object.values(enumLike);

  if (!allowed.includes(value)) {
    throw new ValidationError(`invalid-${key}`, `${key} is invalid.`);
  }

  return value as T;
}

export function parseDateTimeField(formData: FormData, key: string) {
  const raw = getFormString(formData, key);
  if (!raw) {
    return null;
  }

  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) {
    throw new ValidationError(`invalid-${key}`, `${key} is not a valid date.`);
  }

  return value;
}

export function parseUrlField(
  formData: FormData,
  key: string,
  options?: {
    optional?: boolean;
  },
) {
  const raw = getFormString(formData, key);
  if (!raw) {
    if (options?.optional) {
      return null;
    }

    throw new ValidationError(`missing-${key}`, `${key} is required.`);
  }

  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new ValidationError(`invalid-${key}`, `${key} must be http or https.`);
    }

    return url.toString();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(`invalid-${key}`, `${key} is not a valid URL.`);
  }
}

export function parseSlugField(formData: FormData, key: string) {
  const value = requireFormString(formData, key, { maxLength: 80 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new ValidationError(`invalid-${key}`, `${key} must be a kebab-case slug.`);
  }

  return value;
}

export function parseCouponCodeField(formData: FormData, key: string, options?: { optional?: boolean }) {
  const raw = getFormString(formData, key).toUpperCase();
  if (!raw) {
    if (options?.optional) {
      return "";
    }

    throw new ValidationError(`missing-${key}`, `${key} is required.`);
  }

  if (!/^[A-Z0-9_-]{3,32}$/.test(raw)) {
    throw new ValidationError(`invalid-${key}`, `${key} is invalid.`);
  }

  return raw;
}

export function parseEgyptPhoneField(formData: FormData, key: string) {
  const value = requireFormString(formData, key);
  if (!/^01[0-2,5]\d{8}$/.test(value)) {
    throw new ValidationError(`invalid-${key}`, `${key} must be a valid Egyptian mobile number.`);
  }

  return value;
}

export function parseStringList(raw: string) {
  return raw
    .split(/\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseTagList(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/,|،/g)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function validateUploadFile(
  file: FormDataEntryValue | null,
  options: {
    required?: boolean;
    maxBytes: number;
    allowedMimeTypes: string[];
  },
) {
  if (!(file instanceof File)) {
    if (options.required) {
      throw new ValidationError("missing-file", "A file upload is required.");
    }

    return null;
  }

  if (file.size === 0) {
    throw new ValidationError("empty-file", "Uploaded file is empty.");
  }

  if (file.size > options.maxBytes) {
    throw new ValidationError("file-too-large", "Uploaded file is too large.");
  }

  if (!options.allowedMimeTypes.includes(file.type)) {
    throw new ValidationError("invalid-file-type", "Uploaded file type is not allowed.");
  }

  return file;
}
