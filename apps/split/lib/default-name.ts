const pad = (n: number) => String(n).padStart(2, "0");

/** "Entry #2611221430": the year, month, day, hour and minute it was made. */
export function defaultName(d = new Date()): string {
  return `Entry #${pad(d.getFullYear() % 100)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** The browser's local-time name if it sent a well-formed one, else the server's. */
export function resolveDefaultName(fromClient: string): string {
  return /^Entry #\d{10}$/.test(fromClient) ? fromClient : defaultName();
}
