import {
  AsyncDeflate, Deflate, AsyncGzip, AsyncZlib, AsyncInflate, AsyncGunzip,
  AsyncUnzlib, AsyncFlateStreamHandler, FlateStreamHandler, Gzip, Zlib,
  Gunzip, Unzlib, Inflate, AsyncFlateDrainHandler
} from 'fflate';
import {
  CompressionFormat, CompressionStreamConstructor,
  DecompressionStreamConstructor
} from './types';
export type {
  CompressionFormat, CompressionStream, CompressionStreamConstructor,
  DecompressionStream, DecompressionStreamConstructor
} from './types';

interface BaseSyncStream {
  ondata: FlateStreamHandler;
  push: (chunk: Uint8Array, final?: boolean) => void;
}

interface BaseStream {
  ondata: AsyncFlateStreamHandler;
  ondrain?: AsyncFlateDrainHandler;
  queuedSize: number;
  push: (chunk: Uint8Array, final?: boolean) => void;
}

const wrapSync = (Stream: { new(): BaseSyncStream }) => {
  class AsyncWrappedStream implements BaseStream {
    ondata: AsyncFlateStreamHandler;
    ondrain?: AsyncFlateDrainHandler;
    queuedSize: number;
    private i: InstanceType<typeof Stream>;

    constructor() {
      this.i = new Stream();
      this.i.ondata = (data, final) => {
        this.ondata(null, data, final);
      }
    }

    push(data: Uint8Array, final?: boolean) {
      try {
        this.queuedSize += data.length;
        this.i.push(data, final);
        this.queuedSize -= data.length;
        if (this.ondrain) this.ondrain(data.length);
      } catch (err) {
        this.ondata(err, null, final || false)
      }
    }
  }

  return AsyncWrappedStream
}

// Safari fix
let hasWorker = 1;
try {
  const test = new AsyncDeflate();
  test.terminate()
} catch (err) {
  hasWorker = 0;
}

const compressors = hasWorker ? {
  'gzip': AsyncGzip,
  'deflate': AsyncZlib,
  'deflate-raw': AsyncDeflate
} : {
  'gzip': wrapSync(Gzip),
  'deflate': wrapSync(Zlib),
  'deflate-raw': wrapSync(Deflate)
} ;

const decompressors = hasWorker ? {
  'gzip': AsyncGunzip,
  'deflate': AsyncUnzlib,
  'deflate-raw': AsyncInflate
} : {
  'gzip': wrapSync(Gunzip),
  'deflate': wrapSync(Unzlib),
  'deflate-raw': wrapSync(Inflate)
} ;

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
      let endCb: () => void;

      super({
        start: controller => {
          compressor.ondata = (err, dat, final) => {
            if (err) controller.error(err);
            else if (dat) {
              controller.enqueue(dat);
              if (final) {
                if (endCb) endCb()
                else controller.terminate()
              }
            }
          }
        },
        transform: chunk => {
          if (chunk instanceof ArrayBuffer) chunk = new Uint8Array(chunk);
          else if (ArrayBuffer.isView(chunk)) {
            chunk = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          } else {
            throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
          }
          compressor.push(chunk as Uint8Array);

          // use fflate internal buffering to keep worker message channel fed
          if (compressor.queuedSize >= 32768) {
            return new Promise(resolve => {
              compressor.ondrain = () => {
                if (compressor.queuedSize < 32768) resolve();
              }
            })
          }
        },
        flush: () => new Promise(resolve => {
          endCb = resolve;
          compressor.push(new Uint8Array(0), true);
        })
      }, {
        size: chunk => chunk.byteLength | 0,
        highWaterMark: 65536
      }, {
        size: chunk => chunk.byteLength | 0,
        highWaterMark: 65536
      })
    }
  }

  return BaseCompressionStream;
}
export function makeCompressionStream(TransformStreamBase: typeof TransformStream): CompressionStreamConstructor {
  return makeMulti(TransformStreamBase, compressors, 'CompressionStream');
}

export function makeDecompressionStream(TransformStreamBase: typeof TransformStream): DecompressionStreamConstructor {
  return makeMulti(TransformStreamBase, decompressors, 'DecompressionStream');
}
