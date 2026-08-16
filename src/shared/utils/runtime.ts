/** Runtime-only values kept outside React render functions. */
export function runtimeNow() {
  return Date.now();
}

export function randomToken() {
  return Math.random().toString(16).slice(2);
}

export function createRuntimeId(prefix: string) {
  return `${prefix}-${runtimeNow()}-${randomToken()}`;
}
