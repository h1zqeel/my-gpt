
import db from '@/prisma/db';
import { NextRequest, NextResponse } from 'next/server';
import { linkExistingUser, signUpNewUser } from '@/utils/socialLogin';
import { errors } from '@/constants';
import { getUserSession } from '@/utils/session';
import { signToken } from '@/utils/token';
export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');
	const callBackUrl = new URL('/login/api/github/callback', req.url).toString();
	let state = null;

	if(userId) {
		state = await signToken({ userId }, { expiresIn: '1h' });
	}

	let githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${callBackUrl}&scope=read:user`;

	if(state) {
		githubAuthURL += `&state=${state}`;
	}


	return NextResponse.redirect(githubAuthURL);
}

export async function POST(req: NextRequest) {
	const { name, email, userId, githubId } = await req.json();
	let user;

	if(userId) {
		return linkExistingUser({ userId, name, email }, 'github', { githubId });
	}

	user = await db.user.findFirst({
		where: {
			providers: {
				array_contains: [{ name: 'github', identifier: githubId }]
			}
		}
	});

	if(!user) {
		return signUpNewUser({ name, email }, 'github', { githubId });
	}

	return NextResponse.json({
		ok: true,
		user
	});
}

export async function DELETE(req: NextRequest) {
	try{
		const user = await getUserSession({ req });

		let updatedProviders = user?.providers.filter((provider : {name: string}) => provider.name !== 'github');

		const updatedFields : any = {
			providers: updatedProviders
		};

		if(updatedProviders.length === 0 && !user?.username) {
			return NextResponse.json({
				ok: false,
				error: 'You must have at least one provider or a username set.'
			});
		}

		if(updatedProviders.length === 0) {
			updatedFields.email = null;
		}

		await db.user.update({
			where: {
				id: user?.id
			},
			data: updatedFields
		});

		return NextResponse.json({
			ok: true
		});
	} catch(e) {
		console.log(e);
		return NextResponse.json({
			error: errors.DEFAULT
		}, { status: 500 });
	}
}