import { expect } from "chai";
import { Response } from "postman-collection";

export const VAR_CONVERT_TYPE_all = Object.keys(
  {
    string: null,
    number: null,
    boolean: null,
    object: null,
    array: null,
  } satisfies Record<VarConvertType, null>,
) as readonly VarConvertType[];

declare global {
  interface BrunoReqError {
    message: string;
    status: number;
    statusText: string;
    url: string;
    method: string;
  }

  interface BrunoPathParams {
    toObject(): Record<string, string>;
  }

  interface BrunoReq {
    // URL Methods
    getUrl(): string;
    setUrl(url: string): void;
    getHost(): string;
    getPath(): string;
    getQueryString(): string;
    getPathParams(): BrunoPathParams;

    // HTTP Method
    getMethod(): string;
    setMethod(method: string): void;

    // Request Information
    getName(): string;
    getAuthMode(): string;
    getTags(): string[];

    // Header Methods
    getHeader(name: string): string;
    getHeaders(): Record<string, string>;
    setHeader(name: string, value: string): void;
    setHeaders(headers: Record<string, string>): void;
    deleteHeader(name: string): void;
    deleteHeaders(names: string[]): void;

    // Body Methods
    getBody(options?: { raw?: boolean }): any;
    setBody(body: any): void;

    // Request Configuration
    setTimeout(milliseconds: number): void;
    getTimeout(): number;
    setMaxRedirects(count: number): void;

    // Execution Context
    getExecutionMode(): "runner" | "standalone";
    getExecutionPlatform(): "app" | "cli";

    // Error Handling
    onFail(callback: (error: BrunoReqError) => void): void;
  }

  interface BrunoResponseSize {
    body: number;
    headers: number;
    total: number;
  }

  interface BrunoRes {
    // Properties
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
    url: string;

    // Status Methods
    getStatus(): number;
    getStatusText(): string;

    // Header Methods
    getHeader(name: string): string;
    getHeaders(): Record<string, string>;

    // Body Methods
    getBody(): any;
    setBody(body: any): void;

    // URL Methods
    getUrl(): string;

    // Timing & Size
    getResponseTime(): number;
    getSize(): BrunoResponseSize;
  }
  type VarConvertType = "string" | "boolean" | "number" | "object" | "array";
  type Mapping = Record<
    string,
    MayBePath
  >;
  type SetStrategy = "replace" | "propose" | "merge" | "deep-merge";
  type MayBeOptions = {
    type?: VarConvertType;
    strategy?: SetStrategy;
    /**
     * @description
     * If used - should be the string of js function with 1 parameter.
     * The obtained by json-like path value will be used as argument.
     */
    magic?: string | null;
  };
  type MayBePath = string[] | [...string[], MayBeOptions];
  type VarScopeName = "environment" | "collectionVariables" | "globals";
  type VarScope = Record<VarScopeName, {
    get: <T = string>(name: string) => T | null;
    set: (name: string, value: any, type?: VarConvertType) => void;
  }>;
  /// === custom global variables ===
  const res_code: number;
  const magic: Record<`ctx_${VarScopeName}`, {}> & {
    /// general info
    name?: string;
    description?: string;
    /// common testing over res.status codes
    res_codes: number[];
    /// === mapping res data to postman variables ===
    res_jbody_to_env?: Mapping;
    res_jbody_to_col?: Mapping;
    res_jbody_to_globals?: Mapping;
    /// === mapping req data to postman variables ===
    req_jbody_to_env?: Mapping;
    req_jbody_to_col?: Mapping;
    req_jbody_to_globals?: Mapping;
    req_fbody_to_env?: Mapping;
    req_fbody_to_globals?: Mapping;
    req_fbody_to_col?: Mapping;
    /// === mapping raw json object as they are (key=value) ===
    raw_json_to_env?: object;
    raw_json_to_col?: object;
    raw_json_to_globals?: object;
    /// === use extra-prefix for variables to avoid conflicts ===
    prefix?: string;
    /// === possible prevention of running request ===
    guard?: {
      env_name_like?: RegExp | RegExp[];
    };
  };
  /// === aka Postman types ===
  const pm: VarScope & {
    environment: {
      name: string;
    };
    info: {
      eventName: "beforeQuery" | "afterResponse";
    };
    test: Function;
    request: {
      name: string;
      body: {
        raw: string;
        formdata: {
          toObject: Function;
        };
      };
    };
    response: Response & {
      transport: {
        http?: {
          statusCode: number;
          headers: { key: string; value: string }[];
        };
      };
    };
    expect: typeof expect;
  };

  const bru: {
    // Environment
    getEnvName(): string;
    hasEnvVar(key: string): boolean;
    getEnvVar(key: string): any;
    setEnvVar(key: string, value: any, options?: { persist?: boolean }): void;
    deleteEnvVar(key: string): void;
    getAllEnvVars(): Record<string, any>;
    deleteAllEnvVars(): void;
    getGlobalEnvVar(key: string): any;
    setGlobalEnvVar(key: string, value: any): void;
    getAllGlobalEnvVars(): Record<string, any>;

    // Variables
    getProcessEnv(key: string): string;
    getCollectionName(): string;
    getCollectionVar(key: string): any;
    hasCollectionVar(key: string): boolean;
    getFolderVar(key: string): any;
    getRequestVar(key: string): any;
    hasVar(key: string): boolean;
    getVar(key: string): any;
    setVar(key: string, value: any): void;
    getAllVars(): Record<string, any>;
    deleteVar(key: string): void;
    deleteAllVars(): void;
    getSecretVar(key: string): any;

    // Runner
    runner: {
      skipRequest(): void;
      setNextRequest(name: string): void;
      halt(): void;
    };
  };
  const req: BrunoReq;
  const res: BrunoRes;
  const test: typeof pm.test;
}

export {};
