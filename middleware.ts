import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/token';
import axios from 'axios';
export const middleware = async(req: NextRequest) => {
	const token = req.cookies.get(process.env.TOKEN_NAME)?.value;
	if(token) {
		const tokenClaims = await verifyToken(token);
		if(tokenClaims) {
			if(!tokenClaims?.payload?.username) {
				await axios.get('auth/api/logout');

				return NextResponse.redirect(new URL('/login', req.url));
			} else {
				return NextResponse.next();
			}
		}
	} else {
		return NextResponse.redirect(new URL('/login', req.url));
	}
};
export const config = {
	matcher: [
		/*
     * Match all request paths except for the ones starting with:
     * - api/auth (Auth API routes)
	 * - login (login page)
	 * - register (register page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
		'/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)'
	]
};