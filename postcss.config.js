/* eslint-env node */
// import pcImport from 'postcss-import';
// import pcURL from 'postcss-url';
// import pcImportURL from 'postcss-import-url';
import { postCSSImport } from './index.js';
export default {
	map: {inline: false},
	plugins: [postCSSImport({ resolveUrls: false, recursive: false })]
};
