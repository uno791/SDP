declare module "papaparse" {
  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean | "greedy";
    complete?: (results: ParseResult<T>) => void;
  }

  export interface PapaStatic {
    parse<T>(
      file: File | string,
      config?: ParseConfig<T>
    ): void;
  }

  const Papa: PapaStatic;

  export type { ParseResult, ParseConfig };

  export default Papa;
}
