import PostCSS from 'postcss';
import { readFile } from 'node:fs/promises';

// @SEE `@import` https://developer.mozilla.org/en-US/docs/Web/CSS/@import
// @SEE RegEx https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group
const URL_REGEX = /url\(["']?[^'")]+['"]?\)/g;
const IMPORT_REGEX = /^(?:(?:url\(["']?)|['"])(?<path>[^'")]+)(?:(?:["']?\)|['"]))(?:\s+layer\((?<layer>[A-z-]+)\))?(?:\s+supports\((?<supports>[^)]+)\))?(?:\s+(?<media>[^;]*)?\s*)?;?/;

export function parseImportRule(str) {
	const { path, supports, layer, media } = IMPORT_REGEX.exec(str.trim())?.groups ?? {};
	return { path, supports, layer, media };
}

export async function loadStyleSheet(url, { signal } = {}) {
	switch(url.protocol) {
		case 'file:':
			return readFile(url.pathname, { encoding: 'utf8', signal });

		case 'https:':
		case 'http:':
			return fetch(url, {
				headers: new Headers({ Accept: 'text/css' }),
			}).then(resp => {
				if (resp.ok) {
					return resp.text();
				} else {
					throw new Error(`${resp.url} [${resp.status} ${resp.statusText}]`);
				}
			});

		default:
			throw new TypeError(`Invalid protocol: "${url.protocol}"`);
	}
}

export function postCSSImport({ recursive = true, resolveUrls = true } = {}) {
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
					if (typeof supports === 'string') {
						const supportsNode = PostCSS.atRule({
							name: 'supports',
							params: `(${supports})`,
							source: atRule.source,
						});

						supportsNode.append(node);
						node = supportsNode;
					} else {
						node.source = atRule.source;
					}

					if (typeof media === 'string') {
						const mediaNode = PostCSS.atRule({
							name: 'media',
							params: media,
							source: node.source,
						});

						mediaNode.append(node);
						node = mediaNode;
					} else {
						node.source = atRule.source;
					}

					if (typeof layer === 'string') {
						const layerNode = PostCSS.atRule({
							name: 'layer',
							params: layer,
							source: node.source,
						});

						layerNode.append(node);
						node = layerNode;
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

export const postcss = true;
