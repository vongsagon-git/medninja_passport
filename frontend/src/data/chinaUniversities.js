// ⭐ 21 มหาลัยแพทย์ในจีนที่นักเรียนไทยเรียนอยู่
// source: institue.json (production data)
// sort: TOP 8 = มหาลัยที่นักเรียนไทยส่วนใหญ่เรียนอยู่ (verified by หมอแตม 2026-07-19)
// → ที่เหลือเรียงตาม name asc
// ใช้กับ /china landing dropdown
const TOP_IDS = [
  39, // Xi'an Jiaotong University Health Science Center
  30, // Hebei Medical University
  35, // Tongji Medical College, HUST (Huazhong)
  36, // Fujian Medical University
  26, // Zhejiang University School of Medicine
  37, // Southern Medical University
  29, // China Medical University (Liaoning)
  27  // Dalian Medical University
]

const ALL = [
  { id: 33, name: 'Capital Medical University', city: 'Beijing' },
  { id: 32, name: 'Cheeloo College of Medicine, Shandong University', city: 'Shandong' },
  { id: 29, name: 'China Medical University', city: 'Liaoning' },
  { id: 41, name: 'Chongqing Medical University', city: 'Chongqing' },
  { id: 27, name: 'Dalian Medical University', city: 'Dalian' },
  { id: 36, name: 'Fujian Medical University', city: 'Fujian' },
  { id: 38, name: 'Guangxi Medical University', city: 'Guangxi' },
  { id: 46, name: 'Harbin Medical University', city: 'Harbin' },
  { id: 30, name: 'Hebei Medical University', city: 'Hebei' },
  { id: 31, name: 'Nanjing Medical University', city: 'Nanjing' },
  { id: 45, name: 'School of Medicine, Southeast University', city: 'Nanjing' },
  { id: 28, name: 'School of Medicine, Xiamen University', city: 'Fujian' },
  { id: 42, name: 'Shanghai Medical College, Fudan University', city: 'Shanghai' },
  { id: 43, name: 'Shanghai University of Medicine and Health Science', city: 'Shanghai' },
  { id: 37, name: 'Southern Medical University', city: 'Guangzhou' },
  { id: 35, name: 'Tongji Medical College, HUST', city: 'Wuhan' },
  { id: 44, name: 'Wenzhou Medical University', city: 'Wenzhou' },
  { id: 39, name: "Xi'an Jiaotong University Health Science Center", city: "Xi'an" },
  { id: 40, name: 'Youjiang Medical University for Nationalities', city: 'Guangxi' },
  { id: 26, name: 'Zhejiang University School of Medicine', city: 'Zhejiang' },
  { id: 34, name: 'Zhejiang University Yiwu Campus', city: 'Yiwu' }
]

const top = TOP_IDS.map(id => ALL.find(u => u.id === id)).filter(Boolean)
const rest = ALL
  .filter(u => !TOP_IDS.includes(u.id))
  .sort((a, b) => a.name.localeCompare(b.name))

export const UNIVERSITIES_CHINA = [...top, ...rest]
