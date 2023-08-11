declare global {
  interface LayoutPageBaseProps {
    children?: React.ReactNode;
    params?: Record<string, unknown>;
  }

  type PageBaseProps = Omit<LayoutPageBaseProps, 'children'>;
  type Expand<T extends object> = { [K in keyof T]: T[K] };
}

export {};
