export interface FrontierRequestContext {
  requestId: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  origin?: string;
}

export function getRequestContext(request: Request): FrontierRequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const requestId =
    request.headers.get("x-request-id") ??
    request.headers.get("x-vercel-id") ??
    crypto.randomUUID();
  const correlationId =
    request.headers.get("x-correlation-id") ??
    request.headers.get("traceparent") ??
    undefined;

  return {
    requestId,
    correlationId,
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp || undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
    origin: request.headers.get("origin") ?? undefined,
  };
}

export function durationMsSince(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}
