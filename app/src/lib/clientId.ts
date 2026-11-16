/**
 * An id made on this device for an idempotent request (an offer, a pass
 * order). It only has to be unique per attempt, not secret: the server pairs
 * it with the signed-in member.
 */
export function newClientId(prefix: string): string {
  const random = () => Math.floor(Math.random() * 0xffffffff).toString(36);
  return `${prefix}_${Date.now().toString(36)}${random()}${random()}`;
}
