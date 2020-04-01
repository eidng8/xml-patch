export function arrayWrap(t: any): any[] | null | undefined {
  if (undefined === t) return undefined;
  if (null === t) return null;
  return Array.isArray(t) ? t : [t];
}
