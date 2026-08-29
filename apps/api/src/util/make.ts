/** Build a class instance from a plain object: make(StopEvent, { name, rating }). */
export function make<T extends object>(cls: new () => T, fields: Partial<T>): T {
  return Object.assign(new cls(), fields);
}
