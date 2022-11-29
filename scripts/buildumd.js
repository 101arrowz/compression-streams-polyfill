const { minify } = require('terser');
const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.resolve(base, 'esm', 'index.mjs'), 'utf-8');
const pony = fs.readFileSync(path.resolve(base, 'esm', 'ponyfill.mjs'))

async function main() {
  
}

main();