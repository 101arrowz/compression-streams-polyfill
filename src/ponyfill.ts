import { AsyncDeflate, AsyncGzip, AsyncZlib, AsyncInflate, AsyncGunzip, AsyncUnzlib, AsyncFlateStreamHandler } from 'fflate';
import { CompressionFormat, CompressionStreamConstructor, DecompressionStreamConstructor } from './types';
export type { CompressionFormat, CompressionStream, CompressionStreamConstructor, DecompressionStream, DecompressionStreamConstructor } from './types';

const compressors = {
  'gzip': AsyncGzip,
  'deflate': AsyncZlib,
  'deflate-raw': AsyncDeflate
};

const decompressors = {
  'gzip': AsyncGunzip,
  'deflate': AsyncUnzlib,
  'deflate-raw': AsyncInflate
};

interface BaseStream {
  ondata: AsyncFlateStreamHandler;
  push: (chunk: Uint8Array, final?: boolean) => void;
}

const makeMulti = (TransformStreamBase: typeof TransformStream, processors: Record<CompressionFormat, { new(): BaseStream; }>, name: string): CompressionStreamConstructor => {
  class BaseCompressionStream extends TransformStreamBase<BufferSource, Uint8Array> {
    constructor(format: CompressionFormat) {
      if (!arguments.length) {
        throw new TypeError(`Failed to construct '${name}': 1 argument required, but only 0 present.`);
      }
      const Processor = processors[format];
      if (!Processor) {
        throw new TypeError(`Failed to construct '${name}': Unsupported compression format: '${format}'`)
      }
      let compressor = new Processor();
      let cb: () => void;
      super({
        start: controller => {
          compressor.ondata = (err, dat, final) => {
            if (err) controller.error(err);
            else if (dat) {
              controller.enqueue(dat);
              if (final) controller.terminate();
            }
            cb();
          }
        },
        transform: chunk => new Promise(resolve => {
          cb = resolve;
          if (chunk instanceof ArrayBuffer) chunk = new Uint8Array(chunk);
          else if (ArrayBuffer.isView(chunk)) {
            chunk = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          } else {
            throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
          }
          compressor.push(chunk as Uint8Array);
        }),
        flush: () => new Promise(resolve => {
          cb = resolve;
          compressor.push(new Uint8Array(0), true);
        })
      }, {
        size: chunk => chunk.byteLength | 0,
        highWaterMark: 65536
      })
    }
  }

  return BaseCompressionStream;
}
export function makeCompressionStream(TransformStreamBase: typeof TransformStream): CompressionStreamConstructor {
  class CompressionStream extends makeMulti(TransformStreamBase, compressors, 'CompressionStream') {}
  return CompressionStream;
}

export function makeDecompressionStream(TransformStreamBase: typeof TransformStream): DecompressionStreamConstructor {
  class DeompressionStream extends makeMulti(TransformStreamBase, decompressors, 'DecompressionStream') {}
  return DeompressionStream;
}
