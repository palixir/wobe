import {
	createSchema,
	createYoga,
	type GraphQLSchemaWithContext,
	type YogaServerOptions,
	type YogaInitialContext,
} from 'graphql-yoga'
import type { MaybePromise, Wobe, WobePlugin } from 'wobe'

export type GraphqlYogaContext =
	| MaybePromise<Record<string, unknown>>
	| ((initialContext: YogaInitialContext) => MaybePromise<unknown>)

export const WobeGraphqlYogaPlugin = ({
	...options
}: {
	schema?: GraphQLSchemaWithContext<Record<string, any>>
	typeDefs?: string
	context?: GraphqlYogaContext
	resolvers?: Record<string, any>
} & Omit<YogaServerOptions<any, any>, 'context'>): WobePlugin => {
	const yoga = createYoga({
		...options,
		schema:
			options.schema ||
			createSchema({
				typeDefs: options.typeDefs || '',
				resolvers: options.resolvers || {},
			}),
	})

	return (wobe: Wobe) => {
		wobe.get(options?.graphqlEndpoint || '/graphql', async ({ request }) =>
			yoga.fetch(request),
		)
		wobe.post(options?.graphqlEndpoint || '/graphql', async ({ request }) =>
			yoga.fetch(request),
		)
	}
}
