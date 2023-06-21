# @shgysk8zer0/postcss-import
Plug-in for importing local & remote stylesheets with PostCSS

## Installation

```bash
npm i @shgysk8zer0/postcss-import
```

## Usage

### `postcss.config.js`

```js
import postCSSImport from '@shgysk8zer0/postcss-import';

export default {
	map: { inline: false },
	plugins: [
	  postCSSImport({ resolveUrls: true, recursive: true }),
	]
};
```
