import {
	createSchema,
	createYoga,
	type GraphQLSchemaWithContext,
	type YogaServerOptions,
} from 'graphql-yoga'
import type { Wobe, WobePlugin } from 'wobe'

export const WobeGraphqlYogaPlugin = ({
	context,
	...options
}: {
	context?: Record<string, any>
	schema?: GraphQLSchemaWithContext<Record<string, any>>
	typeDefs?: string
	resolvers?: Record<string, any>
} & YogaServerOptions<any, any>): WobePlugin => {
	const yoga = createYoga({
		...options,
		schema:
			options.schema ||
			createSchema({
				typeDefs: options.typeDefs || '',
				resolvers: options.resolvers || {},
			}),
		context: context || ((req) => req),
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
