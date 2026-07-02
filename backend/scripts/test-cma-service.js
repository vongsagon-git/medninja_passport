require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const cma = require('../src/modules/preregister/cma.service');

(async () => {
  const ids = [
    { id: '1629900649608', expect: 'registered (พีรดนย์)' },
    { id: '1100701627104', expect: 'registered (กษิดิ์เดช)' },
    { id: '1103600027091', expect: 'passedAll (วาสิตา)' },
    { id: '1101401196681', expect: 'not registered (วงศกร)' },
    { id: '1234567890123', expect: 'not registered (fake)' }
  ];
  for (const { id, expect } of ids) {
    const r = await cma.syncOne(id, { fetchImage: true });
    console.log(`\n[${id}] expect: ${expect}`);
    console.log({
      registered: r.registered,
      nameTh: r.nameTh,
      nameEn: r.nameEn,
      profileImageUrl: r.profileImageUrl,
      passedAll: r.passedAll,
      imageDataUriBytes: r.cmaProfileImage ? r.cmaProfileImage.length : 0,
      detailError: r.detailError,
      error: r.error
    });
    await new Promise(r => setTimeout(r, 500));
  }
})().catch(e => { console.error(e); process.exit(1); });
