/**
 * Ali VOD Video Debugger — เช็ค encryption/format ของ VID จริง ๆ
 *
 * Usage:
 *   AKI=xxx AKS=yyy node scripts/check-ali-video.js c066ba8f7a7b71f1a472f6f7f45a0102
 *
 * หรือ set env ก่อน:
 *   $env:AKI="xxx"; $env:AKS="yyy"; node scripts/check-ali-video.js VID
 */

const RPCClient = require('@alicloud/pop-core').RPCClient

const accessKeyId = process.env.AKI || process.env.ALIBABA_ACCESS_KEY_ID
const accessKeySecret = process.env.AKS || process.env.ALIBABA_ACCESS_KEY_SECRET
const region = process.env.ALIBABA_VOD_REGION || 'ap-southeast-1'
const videoId = process.argv[2]

if (!accessKeyId || !accessKeySecret) {
  console.error('❌ ต้อง set AKI + AKS (Alibaba AccessKey)')
  console.error('   AKI=xxx AKS=yyy node scripts/check-ali-video.js VID')
  process.exit(1)
}
if (!videoId) {
  console.error('❌ ต้องระบุ VideoId เป็น argv[2]')
  console.error('   node scripts/check-ali-video.js c066ba8f7a7b71f1a472f6f7f45a0102')
  process.exit(1)
}

const client = new RPCClient({
  accessKeyId,
  accessKeySecret,
  endpoint: `https://vod.${region}.aliyuncs.com`,
  apiVersion: '2017-03-21'
})

async function main () {
  console.log(`🔍 กำลังเช็ค VID: ${videoId}\n`)

  // 1. GetVideoInfo
  console.log('═══ [1] GetVideoInfo ═══')
  try {
    const info = await client.request('GetVideoInfo', { VideoId: videoId }, { method: 'POST' })
    const v = info.Video || {}
    console.log('  Title:            ', v.Title)
    console.log('  Duration (sec):   ', v.Duration)
    console.log('  Status:           ', v.Status)
    console.log('  TemplateGroupId:  ', v.TemplateGroupId || '(ไม่มี field นี้)')
    console.log('  CreationTime:     ', v.CreationTime)
    console.log('  Size:             ', v.Size)
    console.log()
  } catch (e) {
    console.error('  ❌ Error:', e.message, e.code)
    return
  }

  // 2. GetPlayInfo — ดู stream + encryption
  console.log('═══ [2] GetPlayInfo (streams + encryption) ═══')
  try {
    const play = await client.request('GetPlayInfo', {
      VideoId: videoId,
      Formats: 'mp4,m3u8,mpd',
      StreamType: 'video',
      ResultType: 'Multiple',
      AuthTimeout: 3000
    }, { method: 'POST' })

    const streams = (play.PlayInfoList && play.PlayInfoList.PlayInfo) || []
    console.log(`  Stream count: ${streams.length}`)
    console.log()

    if (streams.length === 0) {
      console.log('  ⚠️ ไม่มี streams — Transcode อาจยังไม่เสร็จ หรือ template ไม่มี stream output')
    }

    streams.forEach((s, i) => {
      console.log(`  ─── Stream ${i + 1} ───`)
      console.log('    Format:        ', s.Format)
      console.log('    Definition:    ', s.Definition)
      console.log('    Encrypt:       ', s.Encrypt)
      console.log('    EncryptType:   ', s.EncryptType || '(none)')
      console.log('    StreamType:    ', s.StreamType)
      console.log('    Size:          ', s.Size)
      console.log('    Bitrate:       ', s.Bitrate)
      console.log('    Width x Height:', `${s.Width}x${s.Height}`)
      console.log('    Duration:      ', s.Duration)
      console.log('    PlayURL:       ', (s.PlayURL || '').substring(0, 100) + '...')
      console.log()
    })

    // Summary — ตรงกับ backend logic
    const formats = new Set()
    const encTypes = new Set()
    let anyEncrypted = false
    for (const s of streams) {
      if (s.Format) formats.add(String(s.Format).toLowerCase())
      if (s.EncryptType) encTypes.add(String(s.EncryptType))
      if (s.Encrypt) anyEncrypted = true
    }

    console.log('═══ [3] Detection Result (backend logic) ═══')
    console.log('  Formats detected:     ', [...formats])
    console.log('  EncryptTypes detected:', [...encTypes])
    console.log('  isEncrypted:          ', anyEncrypted)
    console.log('  hasMpd:               ', formats.has('mpd'))
    console.log('  hasM3u8:              ', formats.has('m3u8'))
    console.log('  hasMp4:               ', formats.has('mp4'))

    let variant = 'unknown'
    if (formats.has('mpd') && anyEncrypted) variant = 'drm-widevine'
    else if (encTypes.has('AliyunVoDEncryption')) variant = 'ali-proprietary'
    else if (encTypes.has('HLSEncryption')) variant = 'aes-128'
    else if (formats.has('mp4') && !anyEncrypted) variant = 'nodrm-mp4'
    console.log('  → variant:            ', variant)
    console.log()

    if (variant === 'unknown') {
      console.log('  ⚠️ Variant = unknown — เข้าเงื่อนไขไหนไม่ได้เลย')
      console.log('     สาเหตุที่เป็นไปได้:')
      console.log('     1. Transcode Widevine template ยังไม่เสร็จ (ต้องรอ 10-30 นาที)')
      console.log('     2. ใช้ template ผิด (ต้องเป็น b0dd0b2e79e471f1af0ce6e6d5480102)')
      console.log('     3. Alibaba คืน format/encryption ที่ไม่มีใน list — ดู Format + EncryptType ข้างบน')
    }
  } catch (e) {
    console.error('  ❌ GetPlayInfo error:', e.message, e.code)
  }

  // 4. GetPlayInfo แบบ dash/mpd เฉพาะ — เช็คว่ามี Widevine stream แยกไหม
  console.log('\n═══ [4] GetPlayInfo (dash only) ═══')
  try {
    const play = await client.request('GetPlayInfo', {
      VideoId: videoId,
      Formats: 'dash',
      StreamType: 'video',
      ResultType: 'Multiple',
      AuthTimeout: 3000
    }, { method: 'POST' })
    const streams = (play.PlayInfoList && play.PlayInfoList.PlayInfo) || []
    console.log(`  dash streams: ${streams.length}`)
    streams.forEach((s, i) => {
      console.log(`    [${i}] format=${s.Format} encrypt=${s.Encrypt} encType=${s.EncryptType}`)
    })
  } catch (e) {
    console.log('  (ไม่มี dash หรือ error:', e.message + ')')
  }
}

main().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
