// ============================================================
// DOVI 2.0 — Local React & JSX modular shims
// ============================================================

declare module 'react' {
  export type ReactNode = any;
  export type CSSProperties = any;
  export type FormEvent<T = any> = any;
  export type SyntheticEvent<T = any, E = any> = any;
  export type MouseEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
  export type HTMLAttributes<T> = any;
  export type RefObject<T> = any;
  export type ComponentType<T = any> = any;
  export type PropsWithChildren<P = {}> = P & { children?: ReactNode };

  export interface ErrorInfo {
    componentStack: string;
  }

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useContext<T>(context: any): T;
  export function createContext<T>(defaultValue: T): any;
  export function useRef<T>(initialValue?: T | null): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useId(): string;
  export function StrictMode({ children }: { children: ReactNode }): any;

  export class Component<P = {}, S = {}> {
    constructor(props: P);
    state: S;
    props: P;
    setState(state: S | ((prev: S) => S), callback?: () => void): void;
    render(): ReactNode;
  }
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment, options?: any): {
    render(children: any): void;
    unmount(): void;
  };
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
