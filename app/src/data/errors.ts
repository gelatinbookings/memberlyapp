/**
 * The talent catalog could not be reached (HTTP 503 `catalog_unavailable`).
 * The event and any bookings are untouched; the screen offers Try again.
 */
export class CatalogUnavailableError extends Error {
  readonly code = 'catalog_unavailable';

  constructor(message = 'The talent catalog is unavailable') {
    super(message);
    this.name = 'CatalogUnavailableError';
  }
}

export function isCatalogUnavailable(error: unknown): error is CatalogUnavailableError {
  return error instanceof CatalogUnavailableError || (error as { code?: string } | null)?.code === 'catalog_unavailable';
}
