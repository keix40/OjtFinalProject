export interface GridQuery {
  page: number; // 0-based to match Spring Pageable
  size: number;
  sort?: string;
  search?: string;
  filters?: Record<string, string | number | null>;
}

export interface GridState<T> extends GridQuery {
  items: T[];
  totalElements: number;
  totalPages: number;
  loading: boolean;
}

export function defaultGridState<T>(size = 10): GridState<T> {
  return {
    page: 0,
    size,
    items: [],
    totalElements: 0,
    totalPages: 0,
    loading: false,
  };
}

/** Serialize grid query to Angular query-param map (URL-synced pagination). */
export function gridQueryToParams(query: GridQuery): Record<string, string> {
  const params: Record<string, string> = {
    page: String(query.page),
    size: String(query.size),
  };
  if (query.sort) params['sort'] = query.sort;
  if (query.search) params['search'] = query.search;
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = String(value);
      }
    }
  }
  return params;
}

/** Restore grid query from route query params. */
export function gridQueryFromParams(
  params: Record<string, string | undefined>,
  defaults: Partial<GridQuery> = {}
): GridQuery {
  const page = Number(params['page'] ?? defaults.page ?? 0);
  const size = Number(params['size'] ?? defaults.size ?? 10);
  return {
    page: Number.isFinite(page) && page >= 0 ? page : 0,
    size: Number.isFinite(size) && size > 0 ? Math.min(size, 100) : 10,
    sort: params['sort'] || defaults.sort,
    search: params['search'] || defaults.search || undefined,
    filters: defaults.filters,
  };
}
