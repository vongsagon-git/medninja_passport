/**
 * SystemCircuit — Admin-controlled maintenance breakers (shared with LMS via lmsConn)
 *
 * scope values (fixed):
 *   'my'      → blocks /my, /my/*  (all learning system)
 *   'section' → blocks /my/section/*
 *   'watch'   → blocks /my/watch/*
 *   'live'    → blocks /live/*, /qa/*
 *
 * Only /admin/* bypasses (fail-safe so admin can turn off).
 * Non-admin routes: everyone (including admins in /my /watch) sees maintenance.
 */
const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const systemCircuitSchema = new mongoose.Schema({
  scope: {
    type: String,
    enum: ['my', 'section', 'watch', 'live'],
    required: true,
    unique: true,
    index: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: 'ไอทีกำลังปรับปรุงเนื้อหา\nจะใช้ได้เร็วๆนี้ ขออภัยในความไม่สะดวก'
  },
  estimatedReturn: {
    type: Date,
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true })

module.exports = lmsConn.model('SystemCircuit', systemCircuitSchema)
