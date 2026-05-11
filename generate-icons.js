const fs = require('fs');
const zlib = require('zlib');

function createPNG(size) {
  const bg = [10, 10, 10], accent = [200, 241, 53], dark = [10, 10, 10];
  const pixels = [];
  const cx = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cx;
      const r = size * 0.46, rx_r = size * 0.22;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      const lim = r - rx_r;
      let inRR = (ax <= lim || ay <= lim) ? (ax <= r && ay <= r) : Math.sqrt((ax-lim)**2+(ay-lim)**2)<=rx_r;
      if (!inRR) { pixels.push(0,0,0,0); continue; }
      const roofTopY=size*0.18-cx, roofBaseY=size*0.48-cx, wallBotY=size*0.82-cx;
      const wallW=size*0.28, doorW=size*0.14, doorH=size*0.20;
      const slope=(dy-roofTopY)/(roofBaseY-roofTopY)*size*0.36;
      const inRoof=dy>=roofTopY&&dy<=roofBaseY&&Math.abs(dx)<=slope;
      const inWall=dy>roofBaseY&&dy<=wallBotY&&Math.abs(dx)<=wallW;
      const inDoor=dy>wallBotY-doorH&&dy<=wallBotY&&Math.abs(dx)<=doorW/2;
      let col=inDoor?dark:(inRoof||inWall)?accent:bg;
      pixels.push(col[0],col[1],col[2],255);
    }
  }
  function crc32(buf) {
    let c=0xffffffff;
    for(let i=0;i<buf.length;i++){c^=buf[i];for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xedb88320:0);}
    return c^0xffffffff;
  }
  function chunk(type,data){
    const tb=Buffer.from(type,'ascii'),combined=Buffer.concat([tb,data]);
    const out=Buffer.alloc(12+data.length);
    out.writeUInt32BE(data.length,0);tb.copy(out,4);data.copy(out,8);
    out.writeInt32BE(crc32(combined),8+data.length);
    return out;
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
  ihdr[8]=8;ihdr[9]=6;
  const raw=Buffer.alloc(size*(size*4+1));let pos=0;
  for(let y=0;y<size;y++){raw[pos++]=0;for(let x=0;x<size;x++){const i=(y*size+x)*4;raw[pos++]=pixels[i];raw[pos++]=pixels[i+1];raw[pos++]=pixels[i+2];raw[pos++]=pixels[i+3];}}
  const compressed=zlib.deflateSync(raw);
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',compressed),chunk('IEND',Buffer.alloc(0))]);
}
fs.writeFileSync('./public/icon-192.png',createPNG(192));
fs.writeFileSync('./public/icon-512.png',createPNG(512));
console.log('Icons generated.');
