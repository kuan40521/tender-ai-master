/**
 * 統一台北時區工具函式
 */
export function getTWDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
}

/**
 * 取得今日民國日期字串 (例如 "113/04/22")
 */
export function getMinguoDate(date: Date = getTWDate()): string {
  const minguoYear = date.getFullYear() - 1911
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${minguoYear}/${month}/${day}`
}

/**
 * 取得目前時間點 (例如 "10:30")
 */
export function getTimeStr(date: Date = getTWDate()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
