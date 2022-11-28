const fs = require('fs');
const path = require('path');

const libDir = path.resolve(__dirname, '..', 'lib');
const esmDir = path.resolve(__dirname, '..', 'esm');

const globalTypes = fs.readFileSync(path.resolve(libDir, 'types.d.ts'), 'utf-8')
  .replace(/export /g, 'declare ') + `

declare var CompressionStream: CompressionStreamConstructor;
declare var DecompressionStream: DecompressionStreamConstructor;
`;

const src = fs.readFileSync(path.resolve(libDir, 'ponyfill.js'), 'utf-8')
  .replace(/\/\*\* @class \*\//g, '/*#__PURE__*/');
fs.writeFileSync(path.resolve(libDir, 'ponyfill.js'), src);
fs.unlinkSync(path.resolve(libDir, 'types.js'));
fs.unlinkSync(path.resolve(libDir, 'index.d.ts'));

for (const fn of ['index.js', 'ponyfill.js']) {
  const src = fs.readFileSync(path.resolve(esmDir, fn), 'utf-8')
    .replace(/from '\.\/ponyfill\.js'/, `from './ponyfill.mjs'`)
    .replace(/\/\*\* @class \*\//g, '/*#__PURE__*/');
  fs.unlinkSync(path.resolve(esmDir, fn));
  fs.writeFileSync(path.resolve(esmDir, fn.replace(/\.js/, '.mjs')), src);
}
fs.unlinkSync(path.resolve(esmDir, 'types.js'));
fs.unlinkSync(path.resolve(esmDir, 'index.d.ts'));

const tgt = path.resolve(__dirname, '..', 'ponyfill');
if (!fs.existsSync(tgt)) fs.mkdirSync(tgt);
const cjs = fs.readFileSync(path.resolve(libDir, 'ponyfill.js'), 'utf-8')
  .replace(/require\("\./, `require("../lib`);

const esm = fs.readFileSync(path.resolve(esmDir, 'ponyfill.mjs'), 'utf-8')
  .replace(/from '\./, `from '../lib`);

const dts = fs.readFileSync(path.resolve(libDir, 'ponyfill.d.ts'), 'utf-8')
  .replace(/from '\./g, `from '../lib`);

fs.writeFileSync(path.resolve(tgt, 'index.js'), cjs);
fs.writeFileSync(path.resolve(tgt, 'index.d.ts'), dts);
fs.writeFileSync(path.resolve(tgt, 'esm.mjs'), esm);
fs.writeFileSync(path.resolve(tgt, 'esm.d.ts'), dts);
fs.writeFileSync(path.resolve(libDir, 'global.d.ts'), globalTypes);