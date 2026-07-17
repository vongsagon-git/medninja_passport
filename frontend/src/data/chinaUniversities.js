// ⭐ 21 มหาลัยแพทย์ในจีนที่นักเรียนไทยเรียนอยู่
// source: institue.json (production data)
// sort by name asc — ใช้กับ /china landing dropdown
export const UNIVERSITIES_CHINA = [
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
].sort((a, b) => a.name.localeCompare(b.name))
