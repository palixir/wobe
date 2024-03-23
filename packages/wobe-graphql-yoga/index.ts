import { createYoga, type YogaServerOptions } from 'graphql-yoga'
import { Wobe, type WobePlugin } from 'wobe'

export const WobeGraphqlYogaPlugin = ({
	context,
	...options
}: {
	context?: Record<string, any>
} & YogaServerOptions<any, any>): WobePlugin => {
	const yoga = createYoga({
		...options,
		context: () => ({ ...context }),
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
