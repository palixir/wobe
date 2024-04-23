import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'wobe',
	description: 'A Fast, lightweight simple web framework',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Examples', link: '/markdown-examples' },
		],

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
					{ text: 'Hooks', link: '/doc/concepts/hook' },
					{ text: 'Plugins', link: '/doc/concepts/plugin' },
				],
			},
			{
				text: 'Ecosystem',
				items: [
					{
						text: 'Plugins',
						link: '/doc/ecosystem/plugins',
						items: [
							{
								text: 'GraphQL Yoga',
								link: '/doc/ecosystem/plugins/graphql-yoga',
							},
							{
								text: 'GraphQL Apollo Server',
								link: '/doc/ecosystem/plugins/graphql-apollo-server',
							},
						],
					},
				],
			},
		],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/vuejs/vitepress' },
		],
	},
})
