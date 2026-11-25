function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createIdempotencyKey(operation: string): string {
  return `appbox-web:${operation}:${randomId()}`
}

export function idempotencyHeaders(operation: string): HeadersInit {
  return {
    "Idempotency-Key": createIdempotencyKey(operation)
  }
}
