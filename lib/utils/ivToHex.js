
function ivToHex(iv) {
  const ivBuffer = Buffer.alloc(16);
  let hex = '';
  for (let i=0;i<iv.length;i++) {
    hex += Buffer.from([iv[i]]).toString('hex').padStart(8, '0');
  }
  return hex;
}

module.exports = ivToHex;
