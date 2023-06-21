import PostCSS from 'postcss';
import { URL_REGEX, parseImportRule, loadStyleSheet } from './utils.js';

function postCSSImport({ recursive = true, resolveUrls = true } = {}) {
	async function importURL(tree, _, source) {
		source ??= tree.source.input.file;
		const imports = new Set();

		tree.walkAtRules('import', atRule => {
			const { path, supports, layer, media } = parseImportRule(atRule.params);

			if (typeof path === 'string') {
				imports.add(new Promise(async resolve => {
					const url = new URL(path, source.startsWith('/') ? `file://${source}` : source);
					const css = await loadStyleSheet(url);

					let node = url.protocol === 'file:' || ! resolveUrls
						? PostCSS.parse(css)
						: PostCSS.parse(css).replaceValues(
							URL_REGEX,
							{ fast: 'url(' },
							path => {
								const updated = new URL(path.replace('url(', '').replaceAll(/['")]/g, ''), url);
								return `url("${updated}")`;
							}
						);

					// supports -> media -> layer (inverse order)
					// @TODO Figure out how to indent
					if (typeof supports === 'string') {
						node = PostCSS.atRule({
							name: 'supports',
							params: `(${supports})`,
							nodes: [node],
							source: atRule.source,
						});
					} else {
						node.source = atRule.source;
					}

					if (typeof media === 'string') {
						node = PostCSS.atRule({
							name: 'media',
							params: media,
							nodes: [node],
							source: node.source,
						});
					} else {
						node.source = atRule.source;
					}

					if (typeof layer === 'string') {
						node = PostCSS.atRule({
							name: 'layer',
							params: layer,
							nodes: [node],
							source: node.source,
						});
					} else {
						node.source = atRule.source;
					}

					if (recursive) {
						await importURL(node, null, url.protocol === 'file:' ? url.pathname : url.href);
					}
					node.source = atRule.source;
					atRule.replaceWith(node);
					resolve(node);
				}));
			}

		});

		await Promise.all(Array.from(imports));

		return tree;
	}

	return {
		postcssPlugin: '@shgysk8zer0/postcss-import',
		Once: importURL,
	};
}

postCSSImport.postcss = true;
export default postCSSImport;
