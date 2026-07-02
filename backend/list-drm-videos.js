/**
 * List all video titles in DRM library 626874
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const DRM_LIBRARY_ID = '626874'

async function main() {
  let allVideos = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await fetch(`https://video.bunnycdn.com/library/${DRM_LIBRARY_ID}/videos?page=${page}&itemsPerPage=100`, {
      headers: { AccessKey: BUNNY_API_KEY }
    })
    const data = await res.json()
    allVideos = allVideos.concat(data.items || [])
    totalPages = Math.ceil((data.totalItems || 0) / 100)
    page++
  }

  console.log(`Total: ${allVideos.length} videos in DRM library\n`)

  // Group by folder/category
  const sorted = allVideos.sort((a, b) => a.title.localeCompare(b.title))
  for (const v of sorted) {
    console.log(`${v.guid}  ${v.title}`)
  }
}

main().catch(console.error)
