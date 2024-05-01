import { defineConfig } from 'vitepress'

export default defineConfig({
	title: 'Wobe',
	description: 'A Fast, lightweight simple web framework',
	lastUpdated: true,
	head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
	themeConfig: {
		search: {
			provider: 'local',
		},
		sidebar: [
			{
				text: 'Wobe',
				items: [
					{ text: 'Motivations', link: '/doc/wobe/motivations' },
					{ text: 'Benchmark', link: '/doc/wobe/benchmark' },
				],
			},
			{
				text: 'Concepts',
				items: [
					{ text: 'Wobe', link: '/doc/concepts/wobe' },
					{ text: 'Routes', link: '/doc/concepts/route' },
					{ text: 'Context', link: '/doc/concepts/context' },
					{ text: 'Websocket', link: '/doc/concepts/websocket' },
				],
			},
			{
				text: 'Ecosystem',
				items: [
					{
						text: 'Plugins',
						link: '/doc/ecosystem/plugins/index',
						items: [
							{
								text: 'GraphQL Yoga (official)',
								link: '/doc/ecosystem/plugins/graphql-yoga',
							},
							{
								text: 'GraphQL Apollo Server (official)',
								link: '/doc/ecosystem/plugins/graphql-apollo-server',
							},
						],
					},
					{
						text: 'Hooks',
						link: '/doc/ecosystem/hooks/index',
						items: [
							{
								text: 'Cors',
								link: '/doc/ecosystem/hooks/cors',
							},
							{
								text: 'CSRF',
								link: '/doc/ecosystem/hooks/csrf',
							},
							{
								text: 'Bearer auth',
								link: '/doc/ecosystem/hooks/bearer-auth',
							},
							{
								text: 'Body limit',
								link: '/doc/ecosystem/hooks/body-limit',
							},
							{
								text: 'Logger',
								link: '/doc/ecosystem/hooks/logger',
							},
							{
								text: 'Rate limit',
								link: '/doc/ecosystem/hooks/rate-limit',
							},
							{
								text: 'Secure headers',
								link: '/doc/ecosystem/hooks/secure-headers',
							},
							{
								text: 'Validator',
								link: '/doc/ecosystem/hooks/validator',
							},
						],
					},
				],
			},
		],
		footer: {
			message:
				'Made with ❤️ by <a href="https://github.com/coratgerl">coratgerl</a>',
			copyright: 'Copyright © 2024',
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/coratgerl/wobe' },
			{ icon: 'discord', link: 'https://discord.gg/GVuyYXNvGg' },
		],
	},
})
