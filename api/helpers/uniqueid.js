/**
 * UniqueID generator
 *
 * A tiny, dependency-free ID generator for Node.js using only core modules.
 * - Cryptographically secure by default (crypto.randomBytes)
 * - URL-safe default alphabet
 * - Supports custom alphabets
 * - Includes a fast non-secure generator for low-risk use-cases
 */

const crypto = require('crypto');

// URL-safe alphabet similar to nanoid: [a-zA-Z0-9_-]
const URL_ALPHABET = '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// -------- Internal Helpers --------

/**
 * Ensure alphabet is valid:
 * - Non-empty string
 * - At most 255 chars
 * - All characters unique
 */
function validateAlphabet(alphabet) {
  if (typeof alphabet !== 'string' || alphabet.length === 0) {
    throw new TypeError('Alphabet must be a non-empty string.');
  }

  if (alphabet.length > 255) {
    // We need to fit indices into a single byte (0–255)
    throw new RangeError('Alphabet must contain no more than 255 unique characters.');
  }

  const set = new Set(alphabet);
  if (set.size !== alphabet.length) {
    throw new TypeError('Alphabet must contain only unique characters (no duplicates).');
  }
}

/**
 * Core ID generator using crypto.randomBytes and rejection sampling to avoid bias.
 *
 * @param {string} alphabet - String of unique characters.
 * @param {number} size - Length of ID to generate.
 * @returns {string}
 */
function generateIdSecure(alphabet, size) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError('Size must be a positive integer.');
  }

  validateAlphabet(alphabet);

  const alphabetLength = alphabet.length;

  // Rejection sampling: we only accept bytes < mask to keep modulo unbiased.
  const mask = 255 - (256 % alphabetLength);
  let id = '';

  // Loop until we have enough characters.
  // Each iteration pulls a batch of random bytes and consumes from it.
  while (id.length < size) {
    // Batch size can be tuned; using `size` is simple and usually enough.
    const bytes = crypto.randomBytes(size);

    for (let i = 0; i < bytes.length && id.length < size; i++) {
      const byte = bytes[i];

      if (byte >= mask) {
        // This would introduce bias, skip.
        continue;
      }

      const index = byte % alphabetLength;
      id += alphabet[index];
    }
  }

  return id;
}

/**
 * Non-secure generator using Math.random (fast, but not cryptographically strong).
 *
 * @param {string} alphabet
 * @param {number} size
 * @returns {string}
 */
function generateIdNonSecure(alphabet, size) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError('Size must be a positive integer.');
  }

  validateAlphabet(alphabet);

  const alphabetLength = alphabet.length;
  let id = '';

  for (let i = 0; i < size; i++) {
    const rand = Math.floor(Math.random() * alphabetLength);
    id += alphabet[rand];
  }

  return id;
}

// -------- Public API --------

/**
 * Generate cryptographically secure URL-safe ID.
 *
 * @param {number} [size=21] - Length of the ID.
 * @returns {string}
 *
 * Usage:
 *   const { nanoid } = require('./nanoid-replacement');
 *   const id = nanoid();          // default 21 chars
 *   const shortId = nanoid(10);   // 10 chars
 */
function nanoid(size = 21) {
  return generateIdSecure(URL_ALPHABET, size);
}

/**
 * Asynchronous version using crypto.randomBytes async API.
 *
 * @param {number} [size=21]
 * @returns {Promise<string>}
 *
 * Usage:
 *   const id = await nanoidAsync();
 */
async function nanoidAsync(size = 21) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError('Size must be a positive integer.');
  }

  const alphabet = URL_ALPHABET;
  validateAlphabet(alphabet);

  const alphabetLength = alphabet.length;
  const mask = 255 - (256 % alphabetLength);
  let id = '';

  while (id.length < size) {
    const bytes = await new Promise((resolve, reject) => {
      crypto.randomBytes(size, (err, buf) => {
        if (err) return reject(err);
        resolve(buf);
      });
    });

    for (let i = 0; i < bytes.length && id.length < size; i++) {
      const byte = bytes[i];
      if (byte >= mask) continue;
      const index = byte % alphabetLength;
      id += alphabet[index];
    }
  }

  return id;
}

/**
 * Create a reusable secure ID generator for a custom alphabet.
 *
 * @param {string} alphabet - String of unique characters.
 * @param {number} [defaultSize=21] - Default size when the returned function is called without args.
 * @returns {(size?: number) => string}
 *
 * Usage:
 *   const numericId = customAlphabet('0123456789', 10);
 *   const id = numericId();       // 10 digits
 *   const id8 = numericId(8);     // 8 digits
 */
function customAlphabet(alphabet, defaultSize = 21) {
  validateAlphabet(alphabet);

  return function customId(size = defaultSize) {
    return generateIdSecure(alphabet, size);
  };
}

/**
 * Fast, non-secure ID generator.
 * Use ONLY where Math.random()-based randomness is acceptable
 * (e.g., temporary UI keys, non-sensitive identifiers).
 *
 * @param {number} [size=21]
 * @param {string} [alphabet=URL_ALPHABET]
 * @returns {string}
 *
 * Usage:
 *   const id = nonSecureNanoid();          // URL-safe, 21 chars
 *   const id10 = nonSecureNanoid(10);      // 10 chars
 *   const hexId = nonSecureNanoid(16, '0123456789abcdef');
 */
function nonSecureNanoid(size = 21, alphabet = URL_ALPHABET) {
  return generateIdNonSecure(alphabet, size);
}

// -------- Exports --------

// Default export-style (for `const nanoid = require('./nanoid-replacement')`)
module.exports = {
    nanoid,
    nanoidAsync,
    nonSecureNanoid,
    customAlphabet,
    URL_ALPHABET,

    generate: nanoid,
    generateAsync: nanoidAsync,
    generateNonSecure: nonSecureNanoid
}
