import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type SessionPayload = {
  user?: { id: string };
};

async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const sessionUrl = new URL('/api/auth/get-session', request.nextUrl.origin);
    const response = await fetch(sessionUrl, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SessionPayload;
    return data?.user ? data : null;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/trpc') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/' && searchParams.has('error')) {
    const error = searchParams.get('error');
    const signInUrl = new URL('/sign-in', request.url);
    if (error) {
      signInUrl.searchParams.set('error', error);
    }
    return NextResponse.redirect(signInUrl);
  }

  if (isPublicPath(pathname)) {
    if (pathname.startsWith('/sign-in')) {
      const session = await getSession(request);
      if (session?.user) {
        return NextResponse.redirect(new URL('/quest-board', request.url));
      }
    }
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (session?.user && pathname === '/') {
    return NextResponse.redirect(new URL('/quest-board', request.url));
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
