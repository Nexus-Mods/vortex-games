const C1 = 0xcc9e2d51;
const C2 = 0x1b873593;
const SEED = -1;

function multiply(lhs, rhs) {
  // Multiplies two 32 bit integers and returns a 32 bit integer
  return ((lhs & 0xffff) * rhs) + ((((lhs >>> 16) * rhs) & 0xffff) << 16);
}

function rotLeft(lhs, rhs) {
  return (lhs << rhs) | (lhs >>> (32 - rhs));
}

function fmix(h) {
  h ^= h >>> 16;
  h  = multiply(h, 0x85ebca6b);
  h ^= h >>> 13;
  h  = multiply(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h;
}

function getMurmur3Hash(filePath) {
  const buffer = Buffer.from(filePath, 'utf16le');
  let h1 = SEED;
  let k1 = 0;
  let iter = 0;
  let chunk = buffer.slice(iter, iter + 4);
  while (chunk.length > 0) {
    if (chunk.length === 4) {
      k1 = (chunk[0] | (chunk[1] << 8) | (chunk[2] << 16) | (chunk[3] << 24));
      k1 = multiply(k1, C1);
      k1 = rotLeft(k1, 15);
      k1 = multiply(k1, C2);

      h1 ^= k1;
      h1 = rotLeft(h1, 13);
      h1 = multiply(h1, 5) + 0xe6546b64;
    } else {
      switch(chunk.length) {
      case 3:
          k1 = (chunk[0] | (chunk[1] << 8) | (chunk[2] << 16));
          break;
      case 2:
          k1 = (chunk[0] | (chunk[1] << 8));
          break;
      case 1:
          k1 = (chunk[0]);
          break;
      }

      k1 = multiply(k1, C1);
      k1 = rotLeft(k1, 15);
      k1 = multiply(k1, C2);
      h1 ^= k1;
    }
    iter += 4;
    chunk = buffer.slice(iter, iter + 4);
  }

  h1 ^= buffer.length;
  h1 = fmix(h1);

  return h1 >>> 0;
}

module.exports = {
  getMurmur3Hash
}