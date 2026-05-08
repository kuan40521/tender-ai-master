export type TenderStatus = "new" | "favorited" | "ignored"

export type ProcurementType = "勞務類" | "財物類" | "工程類"
export type BiddingType = "公開招標" | "限制性招標" | "公開取得報價"

export interface Tender {
  id: string
  agency: string
  title: string
  budget: number // TWD
  biddingType: BiddingType
  procurementType: ProcurementType
  publishDate: string // YYYY-MM-DD
  deadline: string // YYYY-MM-DD
  confidence: number // 0-100
  tags: string[]
  aiReason: string
  sourceUrl: string
  status: TenderStatus
}

export interface CrawlerRun {
  time: string // HH:MM
  date: string // YYYY-MM-DD
  status: "success" | "failed" | "warning"
  fetched: number
  filtered: number
  message?: string
}

export interface Keyword {
  id: string
  term: string
  createdAt: string
}

export interface Recipient {
  id: string
  name: string
  email: string
  enabled: boolean
}

export const mockTenders: Tender[] = [
  {
    id: "T-2026-0421-001",
    agency: "臺北市政府資訊局",
    title: "智慧城市整合管理平台系統建置案",
    budget: 48_500_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-18",
    deadline: "2026-04-29",
    confidence: 94,
    tags: ["系統開發", "平台建置", "智慧城市"],
    aiReason:
      "案件涉及跨域資料整合與 API 介接，符合 ICT 系統建置範疇，預算規模中高階，且明確要求開發儀表板與資料視覺化，屬高價值商機。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-002",
    agency: "衛生福利部中央健康保險署",
    title: "健保資料 AI 分析與異常偵測平台開發",
    budget: 32_000_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-19",
    deadline: "2026-04-30",
    confidence: 91,
    tags: ["AI 應用", "大數據", "系統開發"],
    aiReason:
      "明確要求機器學習模型開發與資料分析管線建置，核心為 AI 服務導入，與本公司 AI 系統建置能力高度吻合。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "favorited",
  },
  {
    id: "T-2026-0421-003",
    agency: "經濟部工業局",
    title: "產業輔導知識管理系統升級案",
    budget: 8_500_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-19",
    deadline: "2026-04-28",
    confidence: 82,
    tags: ["系統開發", "知識管理"],
    aiReason: "既有系統升級案，涵蓋前後端改版與資料遷移，屬標準軟體開發案。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-004",
    agency: "國立臺灣大學",
    title: "校務行政 APP 與網站改版專案",
    budget: 6_200_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-20",
    deadline: "2026-05-02",
    confidence: 78,
    tags: ["APP 開發", "網站改版"],
    aiReason: "包含 iOS/Android 雙平台 APP 與 RWD 網站改版，屬典型軟體開發案。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-005",
    agency: "內政部警政署",
    title: "治安資料分析儀表板建置",
    budget: 15_000_000,
    biddingType: "限制性招標",
    procurementType: "勞務類",
    publishDate: "2026-04-17",
    deadline: "2026-04-25",
    confidence: 88,
    tags: ["大數據", "儀表板", "系統開發"],
    aiReason:
      "建置資料視覺化儀表板與 ETL pipeline，需整合多個資料源，符合 BI/系統整合需求。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-006",
    agency: "教育部",
    title: "數位學習平台雲端化與 AI 個人化推薦",
    budget: 22_800_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-20",
    deadline: "2026-05-05",
    confidence: 93,
    tags: ["AI 應用", "平台建置", "雲端"],
    aiReason:
      "雲端平台建置搭配 AI 推薦引擎導入，技術堆疊涵蓋容器化、資料科學與全端開發。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-007",
    agency: "臺中市政府",
    title: "市府資訊設備維護與耗材供應",
    budget: 3_500_000,
    biddingType: "公開招標",
    procurementType: "財物類",
    publishDate: "2026-04-18",
    deadline: "2026-04-28",
    confidence: 12,
    tags: ["硬體", "維護"],
    aiReason: "以硬體維護及耗材採購為主，非系統建置範疇。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "ignored",
  },
  {
    id: "T-2026-0421-008",
    agency: "財政部關務署",
    title: "關港貿單一窗口介面優化與 API 擴充",
    budget: 18_000_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-21",
    deadline: "2026-05-10",
    confidence: 86,
    tags: ["系統開發", "API 整合"],
    aiReason: "既有系統介面改版與 API 擴充，屬典型 ICT 系統整合案。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-009",
    agency: "高雄市政府交通局",
    title: "智慧交通號誌控制系統建置",
    budget: 65_000_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-16",
    deadline: "2026-04-27",
    confidence: 71,
    tags: ["系統開發", "IoT"],
    aiReason:
      "涵蓋軟體平台與邊緣運算裝置整合，軟體比重約 60%，仍有商機但需注意硬體部分。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
  {
    id: "T-2026-0421-010",
    agency: "行政院環境保護署",
    title: "空氣品質資料收集與預警 AI 模型建置",
    budget: 12_400_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-15",
    deadline: "2026-04-24",
    confidence: 89,
    tags: ["AI 應用", "大數據", "IoT"],
    aiReason:
      "明確以 AI 預測模型為核心交付項目，搭配資料管線建置，與本公司 AI 核心業務高度重疊。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "favorited",
  },
  {
    id: "T-2026-0421-011",
    agency: "經濟部中央地質調查所",
    title: "辦公室冷氣設備汰換工程",
    budget: 2_100_000,
    biddingType: "公開招標",
    procurementType: "工程類",
    publishDate: "2026-04-19",
    deadline: "2026-04-30",
    confidence: 4,
    tags: ["硬體"],
    aiReason: "純空調設備汰換，與 ICT 系統建置無關。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "ignored",
  },
  {
    id: "T-2026-0421-012",
    agency: "桃園市政府資訊科技局",
    title: "市民服務 AI 客服聊天機器人建置",
    budget: 9_800_000,
    biddingType: "公開招標",
    procurementType: "勞務類",
    publishDate: "2026-04-21",
    deadline: "2026-05-08",
    confidence: 95,
    tags: ["AI 應用", "LLM", "系統開發"],
    aiReason:
      "以 LLM 為核心的對話式 AI 專案，含知識庫建置與多通道整合，符合 AI 系統建置高價值案件。",
    sourceUrl: "https://web.pcc.gov.tw/pis/",
    status: "new",
  },
]

export const mockCrawlerRuns: CrawlerRun[] = [
  {
    time: "10:00",
    date: "2026-04-21",
    status: "success",
    fetched: 342,
    filtered: 48,
  },
  {
    time: "14:00",
    date: "2026-04-21",
    status: "success",
    fetched: 287,
    filtered: 41,
  },
  {
    time: "17:00",
    date: "2026-04-21",
    status: "warning",
    fetched: 156,
    filtered: 22,
    message: "部分頁面回應逾時，已自動重試 2 次。",
  },
]

export const mockTargetKeywords: Keyword[] = [
  { id: "k-1", term: "系統", createdAt: "2026-01-05" },
  { id: "k-2", term: "平台", createdAt: "2026-01-05" },
  { id: "k-3", term: "數位", createdAt: "2026-01-05" },
  { id: "k-4", term: "資訊", createdAt: "2026-01-05" },
  { id: "k-5", term: "AI", createdAt: "2026-02-10" },
  { id: "k-6", term: "APP", createdAt: "2026-02-10" },
  { id: "k-7", term: "網站", createdAt: "2026-02-10" },
  { id: "k-8", term: "大數據", createdAt: "2026-03-01" },
]

export const mockNegativeKeywords: Keyword[] = [
  { id: "n-1", term: "維護", createdAt: "2026-01-05" },
  { id: "n-2", term: "維修", createdAt: "2026-01-05" },
  { id: "n-3", term: "空調", createdAt: "2026-01-05" },
  { id: "n-4", term: "影印機", createdAt: "2026-01-05" },
  { id: "n-5", term: "保全", createdAt: "2026-02-10" },
  { id: "n-6", term: "清潔", createdAt: "2026-02-10" },
  { id: "n-7", term: "硬體汰換", createdAt: "2026-02-10" },
]

export const mockRecipients: Recipient[] = [
  { id: "r-1", name: "王建銘（BD 主管）", email: "bd.lead@example.com", enabled: true },
  { id: "r-2", name: "李欣怡（專案經理）", email: "pm.lee@example.com", enabled: true },
  { id: "r-3", name: "陳政宏（技術顧問）", email: "tech.chen@example.com", enabled: false },
]

export const mockTrendData = [
  { date: "04-15", high: 6, medium: 12 },
  { date: "04-16", high: 4, medium: 9 },
  { date: "04-17", high: 8, medium: 14 },
  { date: "04-18", high: 5, medium: 11 },
  { date: "04-19", high: 9, medium: 15 },
  { date: "04-20", high: 11, medium: 18 },
  { date: "04-21", high: 7, medium: 13 },
]

export function parseBudgetToWan(str: string | number): number {
  const n = parseInt(String(str).replace(/,/g, ""), 10)
  return isNaN(n) ? 0 : Math.round(n / 10_000)
}

export function formatBudget(amount: number | string): string {
  let numVal = typeof amount === "number" ? amount : parseInt(String(amount).replace(/,/g, ""), 10)
  if (isNaN(numVal)) return String(amount)

  if (numVal >= 100_000_000) {
    return `${(numVal / 100_000_000).toFixed(1)} 億`
  }
  if (numVal >= 10_000) {
    return `${(numVal / 10_000).toLocaleString("zh-TW", { maximumFractionDigits: 0 })} 萬`
  }
  return numVal.toLocaleString("zh-TW")
}

export function parseMinguoDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const parts = dateStr.split("/")
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10) + 1911
    return new Date(`${year}-${parts[1]}-${parts[2]}`)
  }
  return new Date(dateStr)
}

export function daysUntil(dateStr?: string, todayDate = new Date()): number {
  if (!dateStr) return 0
  const targetDate = parseMinguoDate(dateStr)
  if (isNaN(targetDate.getTime())) return 0
  return Math.ceil((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high"
  if (score >= 60) return "medium"
  return "low"
}
