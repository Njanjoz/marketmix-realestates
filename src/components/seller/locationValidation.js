export function hasTwoWordLocation(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length >= 2;
}
