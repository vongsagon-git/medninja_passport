require('dotenv').config()
const { pushMessage } = require('./src/modules/line/line.webhook.service')
const { buildNL2Flex } = require('./src/modules/line/line.flex.builders')

const ADMIN_UID = 'U2b0de81f0ec73e8561197393683a9e95'

async function run() {
  await pushMessage(ADMIN_UID, [buildNL2Flex()])
  console.log('ส่ง NL2 Flex ไปที่เติ้ลแล้ว!')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
