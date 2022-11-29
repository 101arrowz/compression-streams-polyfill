# compression-streams-polyfill
Lightweight polyfill/ponyfill for the Compression Streams API

## Usage

Install:
```
npm i compression-streams-polyfill # or yarn add, or pnpm add
```

Import:
```js
import 'compression-streams-polyfill';
// CompressionStream and DecompressionStream are now available
```

If your environment doesn't support ES Modules:
```js
require('compression-streams-polyfill');
```

If you want to load from a CDN in the browser:

```html
<!--
You should use either UNPKG or jsDelivr (i.e. only one of the following)
You can specify the version, e.g. with compression-streams-polyfill@0.1.0
-->
<script src="https://unpkg.com/compression-streams-polyfill"></script>
<script src="https://cdn.jsdelivr.net/npm/compression-streams-polyfill"></script>
```

### Ponyfill usage

This polyfill is almost perfectly spec-compliant. Nonetheless, if you'd like to avoid adding `CompressionStream` and `DecompressionStream` to the global scope, you can use the [ponyfill](https://github.com/sindresorhus/ponyfill).

Note that you must supply your own `TransformStream` implementation to use the ponyfill (though `TransformStream` is available in most modern browsers). 
```js
import { makeCompressionStream, makeDecompressionStream } from 'compression-streams-polyfill/ponyfill';

// If you'd like to also ponyfill TransformStream:
// import { TransformStream } from 'web-streams-polyfill/ponyfill';

const CompressionStream = makeCompressionStream(TransformStream);
const DecompressionStream = makeDecompressionStream(TransformStream);
```

## Performance and size
This polyfill is based on [fflate](https://github.com/101arrowz/fflate) and is therefore very fast. It tends to be between 20% slower and 5% faster than Chromium's native `CompressionStream` and `DecompressionStream`.

The polyfill's full bundle size is about 15kB minified, or 6kB gzipped.

## License
MIT