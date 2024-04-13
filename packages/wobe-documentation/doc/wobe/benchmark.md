# Benchmarks

Although performance is not the main focus of Wobe, it is still an important factor when choosing a web framework. To show you that Wobe is not lagging behind despite its philosophy of not being solely focused on performance, we will show you some benchmarks.

## Router

Wobe use a custom router based on the radix tree algorithm. Below are benchmarks comparing it with other popular routers. It's worth noting that the router's impact on overall application performance is typically minimal.

For this benchmark, we executed the router on multiple routes with various scenarios (simple routes, routes with the same radix, routes with parameters, wildcard routes, etc.). We used the same routes as Hono did in her benchmark. Here's the list of all routes used:

-   /user
-   /user/comments
-   /user/lookup/username/:username
-   /event/:id/comments
-   /event/:id/comments **(POST variant)**
-   /very/deeply/nested/route/hello/there
-   /static/\*

The results bellow correspond to the **total time** to found all the routes above.

| Router                                      | Time (in ns/iteration) |
| ------------------------------------------- | :--------------------: |
| Hono SmartRouter(RegExpRouter + TrieRouter) |         470 ns         |
| Radix3                                      |         882 ns         |
| Wobe Radix Router                           |         950 ns         |
| Find my way                                 |        1 154 ns        |
| Koa router                                  |        1 643 ns        |
| Hono TrieRouter                             |        4 560 ns        |

_Execute on a M1 Pro 10 CPU - 16 Gb Ram - 12/04/2024_

## Extracter of the pathname and the search params of the request

We also benchmark our function to extract the pathname and the query params from the request url.
For example in this url : `https://localhost:3000/user/username?id=123`, the pathname is `/user/username` and the query params are `id=123`.

The benchmark is based on multiple routes (short url, very long url, with and without parameters).
The results bellow correspond to the **total time** to extract the pathname and the query params from all the routes (6 routes in total).

| Extracter | Time (in ns/iteration) |
| --------- | :--------------------: |
| Wobe      |         523 ns         |
| Hono      |         601 ns         |

_Execute on a M1 Pro 10 CPU - 16 Gb Ram - 12/04/2024_

## HTTP Server benchmark

Now we will present the more meaningful benchmark, the HTTP server benchmark. We will compare Wobe with other popular web frameworks. The benchmark is based on the number of requests per second that the server can handle.

For the HTTP benchmark, we used [this benchmark](https://github.com/SaltyAom/bun-http-framework-benchmark) which we just add the Wobe framework to it. Indeed, this benchmark is complete and already contains a lot of frameworks.

| Web framework | Number of requests per second (avg) |
| ------------- | :---------------------------------: |
| Bun           |               92 251                |
| Elysia        |               91 986                |
| Wobe          |               80 664                |
| Hono          |               79 916                |
| Fastify       |               50 440                |
| Express       |               31 308                |

_Execute on a M1 Pro 10 CPU - 16 Gb Ram - 12/04/2024_
