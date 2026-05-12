export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  // Preserve Date objects as ISO strings to avoid serialization into empty {}
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  // Duck-type check for Prisma Decimal (toNumber method + Decimal.js internals)
  if (
    typeof obj === "object" &&
    typeof (obj as any).toNumber === "function" &&
    typeof (obj as any).s !== "undefined" &&
    typeof (obj as any).e !== "undefined"
  ) {
    return (obj as any).toNumber() as any;
  }
  if (Array.isArray(obj)) return obj.map(serializeDecimal) as any;
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeDecimal((obj as any)[key]);
      }
    }
    return result;
  }
  return obj;
}
