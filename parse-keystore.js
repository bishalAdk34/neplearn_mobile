const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function readUTF(buffer, offset) {
  const length = buffer.readUInt16BE(offset);
  offset += 2;
  const str = buffer.toString('utf8', offset, offset + length);
  offset += length;
  return { str, offset };
}

function parseJKS(filename) {
  try {
    if (!fs.existsSync(filename)) {
      console.log(`File not found: ${filename}`);
      return;
    }
    const buffer = fs.readFileSync(filename);
    let offset = 0;
    const magic = buffer.readUInt32BE(offset);
    offset += 4;
    if (magic !== 0xfeedfeed) {
      console.log("Not a valid JKS file");
      return;
    }
    const version = buffer.readUInt32BE(offset);
    offset += 4;
    const numEntries = buffer.readUInt32BE(offset);
    offset += 4;
    for (let i = 0; i < numEntries; i++) {
      const entryType = buffer.readUInt32BE(offset);
      offset += 4;
      const aliasRes = readUTF(buffer, offset);
      const alias = aliasRes.str;
      offset = aliasRes.offset;
      const date = buffer.readBigUInt64BE(offset);
      offset += 8;
      if (entryType === 1) { // Private key entry
        const keyLen = buffer.readUInt32BE(offset);
        offset += 4;
        offset += keyLen; // Skip key data
        const certCount = buffer.readUInt32BE(offset);
        offset += 4;
        for (let j = 0; j < certCount; j++) {
          const typeRes = readUTF(buffer, offset);
          const certType = typeRes.str;
          offset = typeRes.offset;
          const certLen = buffer.readUInt32BE(offset);
          offset += 4;
          const certData = buffer.slice(offset, offset + certLen);
          offset += certLen;
          const sha1 = crypto.createHash('sha1').update(certData).digest('hex').toUpperCase();
          const sha256 = crypto.createHash('sha256').update(certData).digest('hex').toUpperCase();
          console.log(`\n--- Keystore Fingerprints for alias '${alias}' ---`);
          console.log(`SHA-1  : ${sha1.match(/.{1,2}/g).join(':')}`);
          console.log(`SHA-256: ${sha256.match(/.{1,2}/g).join(':')}`);
        }
      } else if (entryType === 2) { // Trusted cert entry
        const typeRes = readUTF(buffer, offset);
        const certType = typeRes.str;
        offset = typeRes.offset;
        const certLen = buffer.readUInt32BE(offset);
        offset += 4;
        const certData = buffer.slice(offset, offset + certLen);
        offset += certLen;
        const sha1 = crypto.createHash('sha1').update(certData).digest('hex').toUpperCase();
        console.log(`\n--- Keystore Fingerprints for trusted cert '${alias}' ---`);
        console.log(`SHA-1  : ${sha1.match(/.{1,2}/g).join(':')}`);
      }
    }
  } catch (err) {
    console.error("Error parsing keystore:", err);
  }
}

const keystorePath = path.join(__dirname, 'android', 'app', 'debug.keystore');
parseJKS(keystorePath);
