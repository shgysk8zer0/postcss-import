import { readFile } from 'node:fs/promises';

// @SEE `@import` https://developer.mozilla.org/en-US/docs/Web/CSS/@import
// @SEE RegEx https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_capturing_group
export const URL_REGEX = /url\(["']?[^'")]+['"]?\)/g;
export const IMPORT_REGEX = /^(?:(?:url\(["']?)|['"])(?<path>[^'")]+)(?:(?:["']?\)|['"]))(?:\s+layer\((?<layer>[A-Za-z-]+)\))?(?:\s+supports\((?<supports>[^)]+)\))?(?:\s+(?<media>[^;]*)?\s*)?;?/;

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
