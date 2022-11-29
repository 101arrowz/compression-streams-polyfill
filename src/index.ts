import { makeCompressionStream, makeDecompressionStream } from './ponyfill';

type Global = typeof globalThis & {
  CompressionStream?: unknown;
  DecompressionStream?: unknown;
}

declare var global: Global;

const globals: Global =
  typeof globalThis == 'undefined'
    ? typeof self == 'undefined'
      ? typeof global == 'undefined'
        ? {} as Global
      : global
    : self
  : globalThis;

if (typeof globals.CompressionStream == 'undefined') {
  globals.CompressionStream = makeCompressionStream(TransformStream);
}

if (typeof globals.DecompressionStream == 'undefined') {
  globals.DecompressionStream = makeDecompressionStream(TransformStream);
}