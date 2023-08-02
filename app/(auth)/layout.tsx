import { FC } from 'react';

interface AuthLayoutProps extends LayoutPageBaseProps {}

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="h-full flex justify-center items-center">{children}</div>
  );
};

export default AuthLayout;
