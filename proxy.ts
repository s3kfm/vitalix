import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Better Auth validates its own authentication endpoints.
  if (path.startsWith('/api/auth/')) return NextResponse.next();
  // Keep same-origin checks for patient record mutations.
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
    request.headers.get('origin') !== request.nextUrl.origin
  ) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  const publicPage = path === '/login' || path === '/signup';
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;
  if (!user && !publicPage) {
    if (path.startsWith('/api/'))
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && publicPage) return NextResponse.redirect(new URL('/', request.url));
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
