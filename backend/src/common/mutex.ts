/**
 * Minimal async mutex. better-sqlite3 is a single synchronous connection —
 * two `DataSource.transaction()` calls that overlap in the event loop both
 * issue `BEGIN` on that same connection and SQLite rejects the second one
 * ("cannot start a transaction within a transaction"). Serializing access
 * here keeps the atomic-UPDATE + unique-constraint logic inside the
 * transaction meaningful instead of crashing under real concurrency.
 */
export class Mutex {
  private tail: Promise<unknown> = Promise.resolve();

  runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.tail.then(fn, fn);
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}
