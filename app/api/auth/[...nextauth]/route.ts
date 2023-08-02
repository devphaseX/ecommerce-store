import NextAuth, { NextAuthOptions } from 'next-auth';

const handler = NextAuth(<NextAuthOptions>{});

export { handler as GET, handler as POST };
