type Row = Record<string, any>;

type Filter =
  | { type: "eq"; column: string; value: any }
  | { type: "in"; column: string; values: any[] }
  | { type: "gte"; column: string; value: any }
  | { type: "lte"; column: string; value: any };

type Order = { column: string; ascending: boolean };

type QueryResult = { data: any; error: { message: string } | null };

const initialData: Record<string, Row[]> = {
  users: [
    { user_id: "u1", username: "harshil" },
    { user_id: "u2", username: "guest" },
  ],
  teams: [
    {
      id: 1,
      name: "Arsenal",
      display_name: "Arsenal FC",
      logo_url: "ars.png",
      created_at: "2025-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Chelsea",
      display_name: "Chelsea FC",
      logo_url: "che.png",
      created_at: "2025-01-02T00:00:00Z",
    },
  ],
  venues: [
    {
      id: 10,
      name: "Emirates Stadium",
      city: "London",
      country: "UK",
      created_at: "2025-01-01T00:00:00Z",
    },
  ],
  matches: [
    {
      id: 101,
      league_code: "premier.league",
      season_year: 2025,
      utc_kickoff: "2025-05-01T12:00:00Z",
      status: "scheduled",
      status_detail: null,
      home_team_id: 1,
      away_team_id: 2,
      venue_id: 10,
      home_score: 1,
      away_score: 0,
      created_by: "u1",
      notes_json: {
        privacy: "public",
        invitedUsers: ["guest"],
        duration: 90,
        lineupTeam1: ["Player A1", "Player A2"],
        lineupTeam2: ["Player B1", "Player B2"],
      },
    },
    {
      id: 102,
      league_code: "premier.league",
      season_year: 2025,
      utc_kickoff: "2025-04-01T14:00:00Z",
      status: "final",
      status_detail: "FT",
      home_team_id: 2,
      away_team_id: 1,
      venue_id: 10,
      home_score: 2,
      away_score: 2,
      created_by: "u2",
      notes_json: {
        privacy: "private",
        invitedUsers: ["harshil"],
        duration: 90,
      },
    },
  ],
  match_events: [
    {
      id: 9001,
      match_id: 101,
      minute: 10,
      event_type: "goal",
      team_id: 1,
      player_name: "Player A1",
    },
    {
      id: 9002,
      match_id: 101,
      minute: 42,
      event_type: "yellow_card",
      team_id: 2,
      player_name: "Player B2",
    },
  ],
  match_reports: [
    {
      id: 1,
      match_id: 101,
      message: "Great game!",
      created_at: "2025-01-03T00:00:00Z",
    },
  ],
  favourite_teams: [
    {
      user_id: "u1",
      team_id: 1,
      teams: {
        id: 1,
        name: "Arsenal",
        display_name: "Arsenal FC",
        logo_url: "ars.png",
      },
    },
  ],
  watchalongs: [
    {
      id: "yt1",
      platform: "youtube",
      match_id: 101,
      url: "https://youtu.be/xyz",
      title: "Watchalong 1",
    },
  ],
};

let db: Record<string, Row[]> = clone(initialData);

const idColumns: Record<string, string> = {
  teams: "id",
  venues: "id",
  matches: "id",
  match_events: "id",
  watchalongs: "id",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function getTable(table: string): Row[] {
  if (!db[table]) {
    db[table] = [];
  }
  return db[table];
}

function setTable(table: string, rows: Row[]) {
  db[table] = rows;
}

function nextId(table: string): number {
  const idCol = idColumns[table];
  if (!idCol) {
    return Date.now();
  }
  const tableData = getTable(table);
  const max = tableData.reduce((acc, row) => {
    const id = Number(row[idCol] ?? 0);
    return Number.isFinite(id) && id > acc ? id : acc;
  }, 0);
  return max + 1;
}

function valuesEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (
    (typeof a === "number" || typeof a === "string") &&
    (typeof b === "number" || typeof b === "string")
  ) {
    return String(a) === String(b);
  }
  return false;
}

function toNumberOrNaN(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Number.NaN;
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((filter) => {
      const value = row[filter.column];
      switch (filter.type) {
        case "eq":
          return valuesEqual(value, filter.value);
        case "in":
          return filter.values.some((candidate) =>
            valuesEqual(value, candidate)
          );
        case "gte":
          {
            const left = toNumberOrNaN(value);
            const right = toNumberOrNaN(filter.value);
            if (Number.isNaN(left) || Number.isNaN(right)) return false;
            return left >= right;
          }
        case "lte":
          {
            const left = toNumberOrNaN(value);
            const right = toNumberOrNaN(filter.value);
            if (Number.isNaN(left) || Number.isNaN(right)) return false;
            return left <= right;
          }
        default:
          return true;
      }
    })
  );
}

function applyOrder(rows: Row[], orders: Order[]): Row[] {
  if (!orders.length) return rows;
  const sorted = [...rows];
  sorted.sort((a, b) => {
    for (const { column, ascending } of orders) {
      const av = a[column];
      const bv = b[column];
      if (av === bv) continue;
      if (av == null) return ascending ? -1 : 1;
      if (bv == null) return ascending ? 1 : -1;
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
    }
    return 0;
  });
  return sorted;
}

function toResult(data: any, error: any = null): QueryResult {
  return { data, error };
}

class Query {
  private table: string;
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitCount: number | undefined;
  private action: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private insertRows: Row[] = [];
  private patch: Row = {};
  private singleMode = false;
  private maybeSingleMode = false;
  private conflictColumns: string[] | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(): Query {
    return this;
  }

  insert(rows: Row | Row[]): Query {
    this.action = "insert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  upsert(rows: Row | Row[], options?: { onConflict?: string }): Query {
    this.action = "upsert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    this.conflictColumns = options?.onConflict
      ? options.onConflict.split(",").map((c) => c.trim())
      : null;
    return this;
  }

  update(patch: Row): Query {
    this.action = "update";
    this.patch = patch;
    return this;
  }

  delete(): Query {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any): Query {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, values: any[]): Query {
    this.filters.push({ type: "in", column, values });
    return this;
  }

  gte(column: string, value: any): Query {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  lte(column: string, value: any): Query {
    this.filters.push({ type: "lte", column, value });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): Query {
    this.orders.push({ column, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(count: number): Query {
    this.limitCount = count;
    return this;
  }

  single(): Query {
    this.singleMode = true;
    this.maybeSingleMode = false;
    return this;
  }

  maybeSingle(): Query {
    this.maybeSingleMode = true;
    this.singleMode = false;
    return this;
  }

  private finalize(rows: Row[]): QueryResult {
    let data = rows.map((row) => clone(row));
    if (this.orders.length) {
      data = applyOrder(data, this.orders);
    }
    if (typeof this.limitCount === "number") {
      data = data.slice(0, this.limitCount);
    }

    if (this.singleMode) {
      return toResult(data[0] ?? null, data.length ? null : null);
    }

    if (this.maybeSingleMode) {
      return toResult(data[0] ?? null, null);
    }

    return toResult(data, null);
  }

  private handleInsertOrUpsert(): QueryResult {
    const tableData = getTable(this.table);
    const idCol = idColumns[this.table];
    const results: Row[] = [];

    for (const row of this.insertRows) {
      const candidate = clone(row);
      let updatedIndex = -1;

      if (this.action === "upsert" && this.conflictColumns?.length) {
        updatedIndex = tableData.findIndex((existing) =>
          this.conflictColumns!.every((col) => {
            if (candidate[col] === undefined) return false;
            return valuesEqual(existing[col], candidate[col]);
          })
        );
      }

      if (updatedIndex >= 0) {
        const existing = tableData[updatedIndex];
        const merged = { ...existing, ...candidate };
        if (idCol && existing[idCol] != null) {
          merged[idCol] = existing[idCol];
        }
        tableData[updatedIndex] = merged;
        results.push(clone(merged));
        continue;
      }

      if (idCol && (candidate[idCol] === undefined || candidate[idCol] === null)) {
        candidate[idCol] = nextId(this.table);
      }

      tableData.push(candidate);
      results.push(clone(candidate));
    }

    setTable(this.table, tableData);

    return this.singleMode
      ? toResult(results[0] ?? null, null)
      : this.maybeSingleMode
      ? toResult(results[0] ?? null, null)
      : toResult(results, null);
  }

  private handleUpdate(): QueryResult {
    const tableData = getTable(this.table);
    const filtered = applyFilters(tableData, this.filters);
    const patch = this.patch;

    for (const row of filtered) {
      Object.assign(row, clone(patch));
    }

    setTable(this.table, tableData);
    return this.finalize(filtered);
  }

  private handleDelete(): QueryResult {
    const tableData = getTable(this.table);
    const remaining = tableData.filter(
      (row) => !applyFilters([row], this.filters).length
    );
    setTable(this.table, remaining);
    return toResult([], null);
  }

  private execute(): QueryResult {
    if (this.action === "insert" || this.action === "upsert") {
      return this.handleInsertOrUpsert();
    }
    if (this.action === "update") {
      return this.handleUpdate();
    }
    if (this.action === "delete") {
      return this.handleDelete();
    }

    const tableData = getTable(this.table);
    const filtered = applyFilters(tableData, this.filters);
    return this.finalize(filtered);
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
  ): Promise<TResult1 | TResult2> {
    return new Promise<QueryResult>((resolve) => {
      resolve(this.execute());
    }).then(onfulfilled, onrejected);
  }
}

const supabase = {
  from(table: string) {
    return new Query(table);
  },
  __reset() {
    db = clone(initialData);
  },
  __setTable(table: string, rows: Row[]) {
    setTable(table, clone(rows));
  },
  __getTable(table: string) {
    return clone(getTable(table));
  },
};

export default supabase;
export type MockSupabaseClient = typeof supabase;
