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

/**
 * Error codes the app acts on, mirroring Memberly's backend (GEL-1016, GEL-1035).
 * `offline` and `timeout` are what the HTTP repository reports when a call
 * never got an answer.
 */
export type RepositoryErrorCode =
  | 'dj_unavailable'
  | 'offer_open'
  | 'not_payable'
  | 'pass_unavailable'
  | 'price_changed'
  | 'invalid_offer'
  | 'not_found'
  | 'offline'
  | 'timeout';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  /** `offer_open`: the booking that is already open with this DJ. */
  readonly requestId?: string;
  /** `price_changed`: the server's new total. */
  readonly totalCents?: number;

  constructor(code: RepositoryErrorCode, detail: { requestId?: string; totalCents?: number; message?: string } = {}) {
    super(detail.message ?? code);
    this.name = 'RepositoryError';
    this.code = code;
    this.requestId = detail.requestId;
    this.totalCents = detail.totalCents;
  }
}

export function isRepositoryError(error: unknown, code?: RepositoryErrorCode): error is RepositoryError {
  const found = (error as { code?: string } | null)?.code;
  if (!(error instanceof RepositoryError) && typeof found !== 'string') return false;
  return code ? found === code : true;
}

/** The call never reached the server, or no answer came back in time. */
export function isNetworkFailure(error: unknown): boolean {
  return isRepositoryError(error, 'offline') || isRepositoryError(error, 'timeout');
}
