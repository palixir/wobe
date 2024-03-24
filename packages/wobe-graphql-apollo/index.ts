import { ApolloServer, type ApolloServerOptions } from '@apollo/server'
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import { Wobe, type WobePlugin } from 'wobe'

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

export const WobeGraphqlApolloPlugin = async ({
  options,
  graphqlEndpoint = '/graphql',
  context,
}: {
  options: ApolloServerOptions<any>
  graphqlEndpoint?: string
  context?: Record<string, any>
}): Promise<WobePlugin> => {
  const server = new ApolloServer({
    ...options,
    plugins: [
      ...(options?.plugins || []),
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageProductionDefault({
          footer: false,
        })
        : ApolloServerPluginLandingPageLocalDefault({
          footer: false,
        }),
    ],
  })

  await server.start()

  return (wobe: Wobe) => {
    wobe.get(graphqlEndpoint, async ({ request, ipAdress: 'ipAdress' }) =>
      server
        .executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: request.method,
            body: request.body,
            // @ts-expect-error
            headers: request.headers,
            search: getQueryString(request.url),
          },
          context: () => Promise.resolve({ ...context, request }),
        })
        .then((res) => {
          if (res.body.kind === 'complete') {
            return new Response(res.body.string, {
              status: res.status ?? 200,
              // @ts-expect-error
              headers: res.headers,
            })
          }

          return new Response('')
        })
        .catch((error) => {
          return new Response(error.message, {
            status: error.statusCode,
          })
        }),
    )

    wobe.post(graphqlEndpoint, async ({ request, ipAdress: 'ipAdress' }) =>
      server
        .executeHTTPGraphQLRequest({
          httpGraphQLRequest: {
            method: request.method.toUpperCase(),
            body: await request.json(),
            // @ts-expect-error
            headers: request.headers,
            search: getQueryString(request.url),
          },
          context: () => Promise.resolve({ ...context, request }),
        })
        .then((res) => {
          if (res.body.kind === 'complete') {
            return new Response(res.body.string, {
              status: res.status ?? 200,
              // @ts-expect-error
              headers: res.headers,
            })
          }

          return new Response('')
        })
        .catch((error) => {
          if (error instanceof Error) throw error

          return new Response(error.message, {
            status: error.statusCode,
          })
        }),
    )
  }
}
