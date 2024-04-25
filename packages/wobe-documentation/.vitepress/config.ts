import { defineConfig } from 'vitepress'

export default defineConfig({
	title: 'Wobe',
	description: 'A Fast, lightweight simple web framework',
	lastUpdated: true,
	themeConfig: {
		search: {
			provider: 'local',
		},
		nav: [{ text: 'Home', link: '/' }],
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
					{ text: 'Routes', link: '/doc/concepts/route' },
					{ text: 'Context', link: '/doc/concepts/context' },
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
						],
					},
				],
			},
		],
		footer: {
			message:
				'Released under the <a href="https://github.com/coratgerl/wobe/blob/main/LICENSE">MIT License</a>.',
			copyright:
				'Copyright © 2024 <a href="https://github.com/coratgerl">coratgerl</a>',
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/coratgerl/wobe' },
		],
	},
})
