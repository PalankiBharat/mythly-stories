import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login')) {
    if (token) return NextResponse.redirect(new URL('/stories', req.url));
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except Next.js internals, static files, and login
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
