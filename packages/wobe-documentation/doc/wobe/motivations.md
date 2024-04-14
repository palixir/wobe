# Motivations

## Yet another web framework ?

You must be wondering why yet another web framework, as there are many already in existence, and it seems like just a race for performance. And you're right to ask that question; I must admit to feeling the same way. Wobe is not built on the philosophy of a performance race. While performance is indeed important, it's not more important than developer usability or the simplicity of maintaining the library itself. These aspects have too often been overlooked, leading to libraries that are highly performant but riddled with bugs or non-standard paradigms.

## Wobe's phylosophy

The idea behind creating Wobe arises from several factors. In my experience working with various TypeScript-based web frameworks such as Express, Fastify, Hono, and more recently, Elysia, I've noticed certain trends. On one hand, there are frameworks with extensive features but often outdated or complex to use, that could lacking in performance. On the other hand, there are newer frameworks focused on speed but sometimes sacrificing simplicity or ecosystem. While performance is crucial, real-world scenarios often reveal that then http benchmark doesn't indicate the real performance. Because in the facts, the handler and the business logic take always more time to execute than find the route and call all the hooks. So on, the simplicity and a good eco-system is for me the best indicator for a robust web framework.

Wobe aims to strike a balance by providing a comprehensive toolkit, featuring a diverse array of hooks and common plugins tailored to address a variety of use cases. Wobe take all the advantages of any other frameworks without the inconvenient. It is designed to be **simple** to use, **lightweight**, **fast**, with a focus on developer productivity.
