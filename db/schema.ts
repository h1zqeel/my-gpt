import { pgTable, serial, index, text, varchar, json, integer, date, boolean, pgEnum } from 'drizzle-orm/pg-core';


export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: text('name'),
	username: varchar('username', { length: 256 }).unique(),
	email: varchar('email', { length: 256 }).unique(),
	password: varchar('password', { length: 256 }),
	openAIKey: varchar('openAIKey', { length: 256 }),
	providers: json('providers')
});

export const chats = pgTable('chats', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 256 }),
	creatorId: integer('creatorId').references(() => users.id),
	systemMessage: text('systemMessage').default('You are a helpful AI Assistant'),
	model: varchar('model', { length: 256 }).default('gpt-3.5-turbo'),
	createdAt: date('createdAt').defaultNow(),
	archived: boolean('archived').default(false)
}, (chats)=>{
	return {
		creatorIdIdx: index('creatorId_idx').on(chats.creatorId)
	};
});

export const roleEnum = pgEnum('role', ['user', 'assistant', 'system']);

export const messages = pgTable('messages', {
	id: serial('id').primaryKey(),
	content: text('content'),
	chatId: integer('chatId').references(() => chats.id),
	role: roleEnum('role').default('user'),
	createdAt: date('createdAt').defaultNow(),
	archived: boolean('archived').default(false)
}, (messages)=>{
	return {
		chatIdIdx: index('chatId_idx').on(messages.chatId)
	};
});