import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';
import db from '@/prisma/db';
import { errors } from '@/constants';
const saltRounds = process.env.SALT_ROUNDS || 10;

export async function POST(request: Request) {
	const { username, password } = await request.json();
	if(!username.length || !password.length) {
		return NextResponse.json({ error: errors.USERNAME_PASSWORD_EMPTY }, { status: 400 });
	}

	const hashedPassword = await bcrypt.hash(password, saltRounds);

	try{
		await db.user.create({
			data: {
				username,
				password: hashedPassword
			}
		});
	} catch(e: any) {
		if(e.code === 'P2002') {
			return NextResponse.json({ error: errors.DUPLICATE_USERNAME }, { status: 400 });
		} else {
			return NextResponse.json({ error: errors.DEFAULT }, { status: 500 });
		}
	}

	return NextResponse.json({ ok: true, username });
}