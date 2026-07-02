require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const PASSPORT_URI = process.env.MONGODB_URI_PASSPORT;
if (!PASSPORT_URI) {
  console.error('MONGODB_URI_PASSPORT not set');
  process.exit(1);
}

const CMA_ENDPOINT = 'https://cmathai.org/Students/CheckUsernameSTD';

function cleanId(raw) {
  if (!raw) return '';
  return String(raw).replace(/[-\s]/g, '').trim();
}

async function checkOne(id) {
  try {
    const res = await fetch(CMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://cmathai.org/Students/Auth'
      },
      body: `username_id=${encodeURIComponent(id)}`
    });
    const text = (await res.text()).trim();
    return { ok: true, raw: text, registered: text === '1' };
  } catch (e) {
    return { ok: false, raw: e.message, registered: null };
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('Connecting to passport DB...');
  const conn = await mongoose.createConnection(PASSPORT_URI).asPromise();
  console.log(`Connected: ${conn.host}`);

  const User = conn.collection('users');
  const rawUsers = await User.find(
    { nationalId: { $exists: true, $ne: null, $ne: '' } },
    { projection: { nationalId: 1, firstName: 1, lastName: 1, email: 1 } }
  ).toArray();
  console.log(`Total users with nationalId: ${rawUsers.length}`);

  const rows = [];
  let i = 0;
  for (const u of rawUsers) {
    i++;
    const cleaned = cleanId(u.nationalId);
    if (cleaned.length !== 13) {
      rows.push({
        idx: i,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || '(no name)',
        email: u.email || '',
        rawId: u.nationalId,
        cleanedId: cleaned,
        cmaResult: 'SKIP (not 13 digits)',
        registered: null
      });
      continue;
    }
    const r = await checkOne(cleaned);
    rows.push({
      idx: i,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || '(no name)',
      email: u.email || '',
      rawId: u.nationalId,
      cleanedId: cleaned,
      cmaResult: r.ok ? r.raw : `ERR: ${r.raw}`,
      registered: r.registered
    });
    process.stdout.write(`\r[${i}/${rawUsers.length}] ${cleaned} → ${r.raw}    `);
    await sleep(300);
  }
  console.log('\n');

  console.log('=================== SUMMARY ===================');
  const registered = rows.filter(r => r.registered === true);
  const notRegistered = rows.filter(r => r.registered === false);
  const skipped = rows.filter(r => r.registered === null);
  console.log(`✅ เคยสมัคร ศรว.    : ${registered.length}`);
  console.log(`❌ ยังไม่เคยสมัคร  : ${notRegistered.length}`);
  console.log(`⚠️  Skip/Error      : ${skipped.length}`);
  console.log(`รวม                : ${rows.length}`);
  console.log('===============================================\n');

  console.log('=================== TABLE ===================');
  console.log('No. | Status | NationalId    | Name                          | Email');
  console.log('----+--------+---------------+-------------------------------+---------------------------');
  for (const r of rows) {
    const status = r.registered === true ? '✅ YES'
                  : r.registered === false ? '❌ NO '
                  : '⚠️ SKIP';
    const name = (r.name || '').padEnd(30).substring(0, 30);
    const email = (r.email || '').substring(0, 30);
    console.log(`${String(r.idx).padStart(3)} | ${status} | ${(r.cleanedId || r.rawId || '').padEnd(13)} | ${name} | ${email}`);
  }
  console.log('=============================================');

  const fs = require('fs');
  const path = require('path');
  const outPath = path.resolve(__dirname, `cma-check-result-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`\nSaved JSON: ${outPath}`);

  await conn.close();
  process.exit(0);
})().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
