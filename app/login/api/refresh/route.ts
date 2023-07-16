import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../prisma/db';
import { verifyToken } from '@/utils/token';
import { generateSession } from '@/utils/session';
import { TUser } from '@/types/User';

export async function POST(req: NextRequest) {
	const token = req.cookies.get(process.env.TOKEN_NAME)?.value;
	const claims = await verifyToken(token as string);

	if(claims?.payload.id) {
		const user = await db.user.findUnique({
			where: {
				id: claims?.payload.id as number
			}
		});

		return generateSession(user as TUser);
	}
	return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}