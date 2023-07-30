
import db from '@/prisma/db';
import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuid } from 'uuid';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
	const callBackUrl = new URL('/login/api/google/callback', req.url).toString();

	const oAuth2Client = new OAuth2Client({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, redirectUri: callBackUrl });

	const authorizeUrl = oAuth2Client.generateAuthUrl({
		state: uuid(),
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	});

	return NextResponse.redirect(authorizeUrl);
}

export async function POST(req: NextRequest) {
	const { name, email } = await req.json();
	let user = await db.user.findFirst({
		where: {
			providers: {
				array_contains: [{ name: 'google', email: email }]
			}
		}
	});

	if(!user) {
		let userWithSameEmail = await db.user.findFirst({
			where: {
				email: email
			}
		});

		if(userWithSameEmail) {
			await db.user.update({
				data: {
					providers: [
						...userWithSameEmail.providers as Prisma.JsonArray,
						{ name: 'google', email: email }
					]
				},
				where: {
					id: userWithSameEmail.id
				}
			});

			user = await db.user.findUnique({
				where: {
					id: userWithSameEmail.id
				}
			});
		} else {
			user = await db.user.create({
				data: {
					name,
					email,
					providers: [{ name: 'google', email: email }]
				}
			});
		}
	}

	return NextResponse.json({
		ok: true,
		user
	});
}