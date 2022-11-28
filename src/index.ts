import { makeCompressionStream, makeDecompressionStream } from './ponyfill';

type Global = typeof globalThis & {
  CompressionStream?: unknown;
  DecompressionStream?: unknown;
}

const globals: Global =
  typeof self == 'undefined'
    ? typeof globalThis == 'undefined'
      ? typeof global == 'undefined'
        ? this
      : global
    : globalThis
  : self;

if (typeof globals.CompressionStream == 'undefined') {
  globals.CompressionStream = makeCompressionStream(TransformStream);
}

if (typeof globals.DecompressionStream == 'undefined') {
  globals.DecompressionStream = makeDecompressionStream(TransformStream);
}