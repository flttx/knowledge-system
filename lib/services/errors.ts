export interface ServiceErrorOptions {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export class ServiceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: ServiceErrorOptions) {
    super(message);
    this.name = "ServiceError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export class ValidationError extends ServiceError {
  constructor(details?: Record<string, unknown>) {
    super("请求参数无效。", {
      code: "VALIDATION_ERROR",
      status: 400,
      details,
    });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = "找不到请求的对象。") {
    super(message, { code: "NOT_FOUND", status: 404 });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ServiceError {
  constructor(message = "璇锋眰涓庡綋鍓嶇姸鎬佺浉鍐插突銆?") {
    super(message, { code: "CONFLICT", status: 409 });
    this.name = "ConflictError";
  }
}
