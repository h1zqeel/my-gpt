import cache from './cache';
import moment from 'moment-timezone';
import { TUser } from '@/types/User';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const generateSession = async(user: TUser, { userSessionId, redirect, url } : {userSessionId?: string | null, redirect?: Boolean, url?: string} = {}) => {
	let response;
	response = NextResponse.json(
		{
			ok: true,
			user: {
				id: user.id,
				username: user.username,
				name: user.name
			}
		},
		{ status: 200 }
	);

	if(redirect) {
		response = NextResponse.redirect(new URL('/', url));
	}

	const sessionId = userSessionId || uuidv4();

	const sessionData = {
		id: user.id,
		username: user.username,
		name: user.name,
		email: user.email,
		openAIKey: user.openAIKey,
		providers: user.providers
	};

	await cache.hset(`${process.env.TOKEN_NAME}-sessions`, { [sessionId as string]: JSON.stringify(sessionData) });
	await cache.hset(`${process.env.TOKEN_NAME}-session-last-used`, { [sessionId as string]: moment().unix() });

	response.cookies.set({
		name: process.env.TOKEN_NAME,
		value: sessionId,
		httpOnly: true,
		sameSite: 'lax'
	});

	return response;
};

export const getUserSession =async({ req, sessionId }:{req?: NextRequest, sessionId?: string}) => {
	let userSessionId;
	if(req) {
		userSessionId = req.cookies.get(process.env.TOKEN_NAME)?.value;
	} else if (sessionId) {
		userSessionId = sessionId;
	} else {
		return null;
	}

	const sessionLastAccessed = await cache.hget(`${process.env.TOKEN_NAME}-session-last-used`, userSessionId as string);
	if(sessionLastAccessed) {
		if(moment().diff(moment.unix(sessionLastAccessed as number), 'hours') > 24) {
			await cache.hdel(`${process.env.TOKEN_NAME}-sessions`, userSessionId as string);
			await cache.hdel(`${process.env.TOKEN_NAME}-session-last-used`, userSessionId as string);
			return null;
		}
	}
	const session = await cache.hget(`${process.env.TOKEN_NAME}-sessions`, userSessionId as string);

	if(session) {
		await cache.hset(`${process.env.TOKEN_NAME}-session-last-used`, { [userSessionId as string]: moment().unix() });
	}

	if(!session) {
		return null;
	}
	return session as TUser;
};