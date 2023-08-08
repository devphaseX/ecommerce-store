declare global {
  interface LayoutPageBaseProps {
    children?: React.ReactNode;
    params?: Record<string, unknown>;
  }

  type PageBaseProps = Omit<LayoutPageBaseProps, 'children'>;
}

export {};
