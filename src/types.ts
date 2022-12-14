export type CompressionFormat = 'gzip' | 'deflate' | 'deflate-raw';

export interface CompressionStream extends TransformStream<BufferSource, Uint8Array> {}
export interface CompressionStreamConstructor {
  prototype: CompressionStream;
  new (format: CompressionFormat): CompressionStream;
}

export interface DecompressionStream extends TransformStream<BufferSource, Uint8Array> {}
export interface DecompressionStreamConstructor {
  prototype: DecompressionStream;
  new (format: CompressionFormat): DecompressionStream;
}