import { getConfig } from '@shgysk8zer0/js-utils/rollup';

export default getConfig('./plugin.js', {
	format: 'cjs',
	minify: false,
	sourcemap: false,
	external: ['postcss', 'node:fs/promises'],
});
