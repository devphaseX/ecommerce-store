import { authMiddleware } from '@clerk/nextjs';

export const runtime = 'nodejs';

export default authMiddleware({ publicRoutes: ['/api/:path*'] });

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
