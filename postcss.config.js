/* eslint-env node */
import postCSSImport from './plugin.js';

export default {
	// map: { inline: false },
	// plugins: [postCSSImport({ resolveUrls: false, recursive: false })]
	plugins: [postCSSImport]
};
