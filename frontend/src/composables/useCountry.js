/**
 * useCountry — Country detection composable
 *
 * ดึงข้อมูล country ของ user จาก backend (geoip-lite ที่ DO)
 * ใช้ singleton pattern — เรียก API ครั้งเดียวต่อ session, cache ใน memory
 *
 * ใช้:
 *   const { country, isChina, isThai, ready, refresh } = useCountry()
 *   watch(ready, (r) => { if (r && isChina.value) showBanner() })
 */
import { ref, computed, readonly } from 'vue'
import api from '../services/api'

// Singleton state (shared across all components)
const _country = ref('')
const _detectedBy = ref('')
const _ip = ref('')
const _region = ref('')
const _city = ref('')
const _ready = ref(false)
const _loading = ref(false)
const _error = ref(null)

let _fetchPromise = null

async function fetchWhoami () {
  if (_fetchPromise) return _fetchPromise
  _loading.value = true
  _error.value = null
  _fetchPromise = api.get('/geo/whoami')
    .then(res => {
      _country.value = res.data.country || ''
      _detectedBy.value = res.data.detectedBy || ''
      _ip.value = res.data.ip || ''
      _region.value = res.data.region || ''
      _city.value = res.data.city || ''
      _ready.value = true
      return res.data
    })
    .catch(err => {
      _error.value = err.message || 'geo fetch failed'
      _country.value = 'TH' // fallback
      _ready.value = true
      return null
    })
    .finally(() => {
      _loading.value = false
    })
  return _fetchPromise
}

export function useCountry () {
  // Auto-fetch on first use
  if (!_ready.value && !_loading.value) fetchWhoami()

  return {
    country: readonly(_country),
    detectedBy: readonly(_detectedBy),
    ip: readonly(_ip),
    region: readonly(_region),
    city: readonly(_city),
    ready: readonly(_ready),
    loading: readonly(_loading),
    error: readonly(_error),
    isChina: computed(() => _country.value === 'CN'),
    isThai: computed(() => _country.value === 'TH'),
    isHK: computed(() => _country.value === 'HK'),
    isTaiwan: computed(() => _country.value === 'TW'),
    isSingapore: computed(() => _country.value === 'SG'),
    refresh: () => { _fetchPromise = null; return fetchWhoami() }
  }
}

export default useCountry
