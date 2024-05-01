# Benchmarks

Although performance is not the main focus of Wobe, it is still an important factor when choosing a web framework. So on, we have done some benchmarks to compare Wobe with other popular web frameworks.

## HTTP Server benchmark (on Bun runtime)

Wobe is one of the fastest web framework based on the [benchmark](https://github.com/SaltyAom/bun-http-framework-benchmark) of SaltyAom. Indeed, this benchmark is complete and already contains a lot of others web frameworks.

| Framework | Runtime | Average    | Ping       | Query     | Body      |
| --------- | ------- | ---------- | ---------- | --------- | --------- |
| bun       | bun     | 92,639.313 | 103,439.17 | 91,646.07 | 82,832.7  |
| elysia    | bun     | 92,445.227 | 103,170.47 | 88,716.17 | 85,449.04 |
| wobe      | bun     | 90,535.37  | 96,348.26  | 94,625.67 | 80,632.18 |
| hono      | bun     | 81,832.787 | 89,200.82  | 81,096.3  | 75,201.24 |
| fastify   | bun     | 49,648.977 | 62,511.85  | 58,904.51 | 27,530.57 |
| express   | bun     | 31,370.06  | 39,775.79  | 36,605.68 | 17,728.71 |

_Executed with 5 runs - 12/04/2024_
