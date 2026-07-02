const mongoose = require('mongoose')
const { lmsConn } = require('../../shared/config/db')

const selfCheckProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  templateSlug: { type: String, required: true, lowercase: true },
  checkedItems: [{ type: String }]                            // ["itm_xxxx", ...] — stable item id
}, { timestamps: true })

selfCheckProgressSchema.index({ userId: 1, templateSlug: 1 }, { unique: true })

module.exports = lmsConn.model('SelfCheckProgress', selfCheckProgressSchema)
