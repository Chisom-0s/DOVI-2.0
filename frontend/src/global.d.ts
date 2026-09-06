// ============================================================
// DOVI 2.0 — Global React & JSX Namespace Shims
// ============================================================

declare namespace React {
  type ReactNode = any;
  type CSSProperties = any;
  type FormEvent<T = any> = any;
  type SyntheticEvent<T = any, E = any> = any;
  type MouseEvent<T = any> = any;
  type ChangeEvent<T = any> = any;
  type KeyboardEvent<T = any> = any;
  type TouchEvent<T = any> = any;
  type HTMLAttributes<T> = any;
  type RefObject<T> = any;
  type ComponentType<T = any> = any;
  type PropsWithChildren<P = {}> = P & { children?: ReactNode };
  
  interface ErrorInfo {
    componentStack: string;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
  interface Element {
    [key: string]: any;
  }
  interface IntrinsicAttributes {
    key?: any;
  }
}

declare namespace NodeJS {
  type Timeout = any;
}

interface ImportMeta {
  readonly env: {
    readonly VITE_API_BASE_URL: string;
    readonly [key: string]: string | undefined;
  };
}

declare module '*.css';
