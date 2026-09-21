// A minimal PNG reader, so a Playwright screenshot can be measured in Node
// WITHOUT calling getImageData on the canvas under test. That matters here:
// `canvas-fade-never-arrives` is on record in this project as a bug that
// getImageData HIDES, because reading pixels back de-accelerates the canvas and
// the accelerated path is the one that stalls. A screenshot reads the composited
// output the user actually saw, which is what their photograph is.
const zlib = require('zlib');

function readPNG(buf) {
  let p = 8, w = 0, h = 0, bd = 0, ct = 0, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4);
                           bd = data[8]; ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bd !== 8) throw new Error('only 8-bit PNG: got ' + bd);
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : ct === 4 ? 2 : 0;
  if (!ch) throw new Error('unsupported colour type ' + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * ch), stride = w * ch;
  let q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++];
    for (let x = 0; x < stride; x++) {
      const v = raw[q + x];
      const a = x >= ch ? out[y * stride + x - ch] : 0;             // left
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;              // up
      const c = (x >= ch && y > 0) ? out[(y - 1) * stride + x - ch] : 0;
      let r;
      if (f === 0) r = v;
      else if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else {                                                        // Paeth
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[y * stride + x] = r & 255;
    }
    q += stride;
  }
  return { w, h, ch, data: out };
}

// The statistic that matters for ghosting, and the first version of it was
// WRONG: it reported the brightest pixel, and Mandala draws a bright ring at
// rest, so a saturated 255 said nothing at all. Residue is not "bright", it is
// DIM-BUT-NOT-BLACK - a population of pixels stalled at a few 255ths that the
// fade can no longer move. So the measure is how many pixels sit in [1,24],
// compared against the same style's own resting frame.
function stats(img) {
  const { w, h, ch, data } = img;
  let max = 0, sum = 0, dim = 0, lit = 0, n = w * h;
  const hist = new Array(16).fill(0);
  for (let i = 0; i < n; i++) {
    const o = i * ch;
    const v = Math.max(data[o], data[o + 1] || 0, data[o + 2] || 0);
    if (v > max) max = v;
    sum += v;
    if (v > 0) lit++;
    if (v >= 1 && v <= 24) dim++;
    hist[Math.min(15, v >> 4)]++;
  }
  return { max, mean: +(sum / n).toFixed(3),
           dimFrac: +(dim / n).toFixed(4), litFrac: +(lit / n).toFixed(4),
           dim, n, hist };
}
// The residue's own brightness: the most common non-zero value in [1,24]. The
// arithmetic predicts it lands at floor(0.5/fade), so this is the number that
// either confirms the mechanism or refutes it.
function modeDim(img) {
  const { w, h, ch, data } = img, c = new Array(25).fill(0);
  for (let i = 0; i < w * h; i++) {
    const o = i * ch;
    const v = Math.max(data[o], data[o + 1] || 0, data[o + 2] || 0);
    if (v >= 1 && v <= 24) c[v]++;
  }
  let best = 0;
  for (let v = 1; v <= 24; v++) if (c[v] > c[best]) best = v;
  return { value: best, count: c[best] };
}
module.exports = { readPNG, stats, modeDim };
