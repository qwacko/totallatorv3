import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Totallator',
	description: 'Financial Recordkeeping',
	themeConfig: {
		search: {
			provider: 'local'
		},

		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Installation 🚧', link: '/installation' }
		],

		sidebar: [
			{
				text: 'Install / Config 🚧',
				link: '/installation',
				items: [
					{
						text: 'Environment Variables 🚧',
						link: '/environment-variables'
					},
					{
						text: 'Docker 🚧',
						link: '/docker'
					}
				]
			},
			{
				text: 'Advanced',
				items: [
					{
						text: 'Automatic Import',
						link: '/automatic-import',
						collapsed: true,
						items: [
							{ text: 'Salt Edge', link: '/salt-edge' },
							{ text: 'Akahu', link: '/akahu' }
						]
					},
					{ text: 'Recurring Functions 🚧', link: '/recurring-functions' }
				]
			},
			{
				text: 'Developers 🚧',
				link: '/development',
				items: [
					{ text: 'Contribution 🚧', link: '/contribution' },
					{ text: 'Auto Import Development 🚧', link: '/develop-auto-import' }
				]
			}
		],

		socialLinks: [{ icon: 'github', link: 'https://github.com/qwacko/totallatorv3' }]
	}
});
