import {
	createYoga,
	type YogaSchemaDefinition,
	type YogaServerOptions,
} from 'graphql-yoga'
import { Wobe, type WobePlugin } from 'wobe'

export const WobeGraphqlYogaPlugin = ({
	schema,
	options,
}: {
	schema?: YogaSchemaDefinition<any, any>
	options?: YogaServerOptions<any, any>
}): WobePlugin => {
	const yoga = createYoga({
		...options,
		schema,
	})

	return (wobe: Wobe) => {
		wobe.get(options?.graphqlEndpoint || '/graphql', async (request) =>
			yoga.fetch(request),
		)
		wobe.post(options?.graphqlEndpoint || '/graphql', async (request) =>
			yoga.fetch(request),
		)
	}
}
