import type { Request } from "express";
import { ApiError } from "./apiError";

/**
 * @types/express 5 types route params as `string | string[]`. Our routes use
 * single-value params, so this asserts and narrows to a plain string.
 */
export function reqParam(req: Request, name: string): string {
  const v = req.params[name];
  if (typeof v !== "string") throw ApiError.badRequest(`Missing route parameter: ${name}`);
  return v;
}
