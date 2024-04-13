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
					{ text: 'Hooks', link: '/doc/concepts/hook' },
					{ text: 'Plugins', link: '/doc/concepts/plugin' },
				],
			},
		],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/vuejs/vitepress' },
		],
	},
})
