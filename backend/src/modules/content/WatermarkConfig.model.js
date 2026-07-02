const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const modeSchema = new mongoose.Schema({
  style: { type: String, enum: ['grid', 'center'], default: 'grid' },
  fontSize: { type: Number, default: 18 },
  fontFamily: { type: String, default: '' }
}, { _id: false })

const watermarkConfigSchema = new mongoose.Schema({
  // singleton — ใช้ key คงที่เพื่อให้มีแค่ 1 document
  key: { type: String, default: 'default', unique: true },

  mobilePortrait:      { type: modeSchema, default: () => ({ style: 'center', fontSize: 19 }) },
  mobileLandscape:     { type: modeSchema, default: () => ({ style: 'grid', fontSize: 19 }) },
  mobilePortraitFull:  { type: modeSchema, default: () => ({ style: 'center', fontSize: 20 }) },
  mobileLandscapeFull: { type: modeSchema, default: () => ({ style: 'grid', fontSize: 20 }) },

  desktopPortrait:      { type: modeSchema, default: () => ({ style: 'grid', fontSize: 30 }) },
  desktopLandscape:     { type: modeSchema, default: () => ({ style: 'grid', fontSize: 30 }) },
  desktopPortraitFull:  { type: modeSchema, default: () => ({ style: 'grid', fontSize: 30 }) },
  desktopLandscapeFull: { type: modeSchema, default: () => ({ style: 'grid', fontSize: 30 }) },

  // Desktop breakpoint: ถ้าจอเล็กกว่านี้ (px) เปลี่ยน grid → center
  desktopBreakpoint: { type: Number, default: 900 },
  demoDesktopBreakpoint: { type: Number, default: 900 },

  // สูตร scale: fontSize = basePx × (W / baseWidth)
  centerBaseWidth: { type: Number, default: 384 },
  gridBaseWidth: { type: Number, default: 1280 },

  // Desktop mode in mobile
  desktopModeScreenWidth: { type: Number, default: 1024 },
  desktopInMobile:     { type: modeSchema, default: () => ({ style: 'center', fontSize: 24 }) },
  demoDesktopInMobile: { type: modeSchema, default: () => ({ style: 'center', fontSize: 24 }) },

  // Demo modes
  demoMobilePortrait:      { type: modeSchema, default: () => ({ style: 'center', fontSize: 40 }) },
  demoMobileLandscape:     { type: modeSchema, default: () => ({ style: 'center', fontSize: 60 }) },
  demoMobilePortraitFull:  { type: modeSchema, default: () => ({ style: 'center', fontSize: 40 }) },
  demoMobileLandscapeFull: { type: modeSchema, default: () => ({ style: 'center', fontSize: 60 }) },
  demoDesktopPortrait:      { type: modeSchema, default: () => ({ style: 'grid', fontSize: 60 }) },
  demoDesktopLandscape:     { type: modeSchema, default: () => ({ style: 'grid', fontSize: 60 }) },
  demoDesktopPortraitFull:  { type: modeSchema, default: () => ({ style: 'grid', fontSize: 60 }) },
  demoDesktopLandscapeFull: { type: modeSchema, default: () => ({ style: 'grid', fontSize: 60 }) }
}, { timestamps: true })

module.exports = lmsConn.model('WatermarkConfig', watermarkConfigSchema)
