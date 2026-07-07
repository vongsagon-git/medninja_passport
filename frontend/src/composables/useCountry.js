/**
 * useCountry — Country detection composable
 *
 * ดึงข้อมูล country + IP ของ user จาก backend
 * Singleton — เรียก API ครั้งเดียวต่อ session
 *
 * ใช้:
 *   const { country, ip, isChina, isThai, ready } = useCountry()
 */
import { ref, computed, readonly } from 'vue'
import api from '../services/api'

// Singleton state
const _country = ref('')
const _countryName = ref('')
const _detectedBy = ref('')
const _ip = ref('')
const _region = ref('')
const _city = ref('')
const _isp = ref('')
const _asn = ref('')
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
      // api.js interceptor unwraps → res = data ตรง ๆ (ไม่ใช่ {data: ...})
      const d = (res && res.data) ? res.data : (res || {})
      _country.value = d.country || 'unknown'
      _countryName.value = d.countryName || ''
      _detectedBy.value = d.detectedBy || ''
      _ip.value = d.ip || ''
      _region.value = d.region || ''
      _city.value = d.city || ''
      _isp.value = d.isp || ''
      _asn.value = d.asn || ''
      _ready.value = true
      return d
    })
    .catch(err => {
      // ⚠️ อย่า set _ready = true เพราะจะทำให้ banner แสดง 'unknown'
      // ปล่อยให้ ready = false → banner ซ่อนสนิท (ดีกว่าโชว์ค่าเปล่า)
      _error.value = err.message || 'geo fetch failed'
      _country.value = ''
      return null
    })
    .finally(() => {
      _loading.value = false
    })
  return _fetchPromise
}

// Flag emoji generator จาก country code (ISO 3166-1 alpha-2)
function countryToFlag (code) {
  if (!code || code.length !== 2) return '🌐'
  const A = 127397 // Regional Indicator Symbol offset
  return String.fromCodePoint(
    code.charCodeAt(0) + A,
    code.charCodeAt(1) + A
  )
}

// Human-readable country name (Thai)
const COUNTRY_TH = {
  CN: 'จีน',
  TH: 'ไทย',
  HK: 'ฮ่องกง',
  TW: 'ไต้หวัน',
  SG: 'สิงคโปร์',
  MY: 'มาเลเซีย',
  US: 'สหรัฐฯ',
  GB: 'อังกฤษ',
  JP: 'ญี่ปุ่น',
  KR: 'เกาหลี',
  VN: 'เวียดนาม',
  ID: 'อินโดนีเซีย',
  PH: 'ฟิลิปปินส์',
  LA: 'ลาว',
  KH: 'กัมพูชา',
  MM: 'เมียนมาร์',
  AU: 'ออสเตรเลีย',
  IN: 'อินเดีย',
  DE: 'เยอรมัน',
  FR: 'ฝรั่งเศส'
}

export function useCountry () {
  if (!_ready.value && !_loading.value) fetchWhoami()

  return {
    country: readonly(_country),
    countryName: readonly(_countryName),
    detectedBy: readonly(_detectedBy),
    ip: readonly(_ip),
    region: readonly(_region),
    city: readonly(_city),
    isp: readonly(_isp),
    asn: readonly(_asn),
    ready: readonly(_ready),
    loading: readonly(_loading),
    error: readonly(_error),
    isChina: computed(() => _country.value === 'CN'),
    isThai: computed(() => _country.value === 'TH'),
    isHK: computed(() => _country.value === 'HK'),
    isTaiwan: computed(() => _country.value === 'TW'),
    flag: computed(() => countryToFlag(_country.value)),
    countryTh: computed(() => COUNTRY_TH[_country.value] || _countryName.value || _country.value),
    refresh: () => { _fetchPromise = null; return fetchWhoami() }
  }
}

export default useCountry
