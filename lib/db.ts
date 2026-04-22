import { PrismaClient } from "@prisma/client"
import { mockTenders, mockTargetKeywords, mockNegativeKeywords, mockCrawlerRuns } from "./mock-data"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
})

// --- Ghost Mode 記憶體暫存 (掛載於全域以防止重新載入時重置) ---
const globalForMemory = globalThis as unknown as {
  memoryTenders: any[] | undefined
  memoryLogs: any[] | undefined
  memoryUsers: any[] | undefined
  memoryRecipients: any[] | undefined
  memoryConfigs: any[] | undefined
}

if (!globalForMemory.memoryTenders) {
  globalForMemory.memoryTenders = mockTenders.map(t => ({
    id: t.id,
    agency: t.agency,
    title: t.title,
    budget: String(t.budget),
    releaseDate: t.publishDate,
    dueDate: t.deadline,
    url: t.sourceUrl,
    biddingType: t.biddingType,
    procurementType: t.procurementType,
    confidence: t.confidence,
    tags: JSON.stringify(t.tags),
    reason: t.aiReason,
    status: t.status,
    createdAt: new Date()
  }))
}

if (!globalForMemory.memoryLogs) {
  globalForMemory.memoryLogs = mockCrawlerRuns.map((log, index) => ({
    id: `log-${index}`,
    date: log.date,
    time: log.time,
    status: log.status,
    message: log.message || "執行完成",
    fetchedCount: log.fetched,
    filteredCount: log.filtered,
    createdAt: new Date()
  }))
}

if (!globalForMemory.memoryUsers) {
  globalForMemory.memoryUsers = [
    { id: "admin-id", username: "admin", name: "預設管理員", password: "mock-password" }
  ]
}

if (!globalForMemory.memoryRecipients) {
  globalForMemory.memoryRecipients = [
    { id: "rec-1", name: "關鍵主管", email: "kuan40026@gmail.com", isEnabled: true, createdAt: new Date() }
  ]
}

if (!globalForMemory.memoryConfigs) {
  globalForMemory.memoryConfigs = [
    { key: "ai_prompt", value: `你是一個專業的資通訊產業分析師。我們是一家「客製化軟體開發與系統整合公司」。
請根據標案名稱判定其對「軟體開發商」的商業價值 (0-100分)：
1. 【極高分 85-100】：涉及 AI 演算法、情資分析、資安防護、客製軟體開發、大數據平台。
2. 【中高分 60-84】：單純的系統整合案、APP 開發、雲端遷移。
3. 【低分 0-59】：
   - 排除硬體：攝像(CCTV)、錄影、監控、變頻器、馬達、電力設備、消防空調安裝。
   - 排除勞務：3D 掃描、數位化保存、考古、修護、教材推廣、農業調查、支援、勞務。
   - 排除土木：水利、清淤、道路、建築。` },
    { key: "dailyDigest", value: "true" },
    { key: "dailyTimes", value: '["10:39", "17:30"]' },
    { key: "threshold", value: "80" },
    { key: "scrapeTimes", value: '["09:00", "10:39", "14:00", "17:00"]' }
  ]
}

// --- Ghost Mode Proxy 與 熔斷機制 ---
const globalForBreaker = globalThis as unknown as {
  isCircuitBroken: boolean | undefined
  lastAttemptTime: number | undefined
}

const COOLDOWN_MS = 600000 // 10 分鐘冷卻

export const db = new Proxy(prisma, {
  get(target, prop, receiver) {
    const original = Reflect.get(target, prop, receiver)
    
    if (typeof original === 'object' && original !== null) {
      return new Proxy(original, {
        get(mTarget, mProp) {
          const mOriginal = Reflect.get(mTarget, mProp)
          
          if (typeof mOriginal === 'function') {
            return async (...args: any[]) => {
              const now = Date.now()
              
              // 使用全域標記判斷是否熔斷
              if (globalForBreaker.isCircuitBroken && (now - (globalForBreaker.lastAttemptTime || 0) < COOLDOWN_MS)) {
                return handleGhostOperation(prop, mProp, args)
              }

              try {
                const result = await mOriginal.apply(mTarget, args)
                globalForBreaker.isCircuitBroken = false
                return result
              } catch (error: any) {
                if (error.message?.includes("Can't reach database") || error.code === 'P1001') {
                  console.warn(`[Ghost Mode] Circuit broken for ${String(prop)}, staying in fallback.`)
                  globalForBreaker.isCircuitBroken = true
                  globalForBreaker.lastAttemptTime = now
                  return handleGhostOperation(prop, mProp, args)
                }
                throw error
              }
            }
          }
          return mOriginal
        }
      })
    }
    return original
  }
}) as PrismaClient

// 輔助函式：處理 Ghost Mode 下的各項操作
async function handleGhostOperation(prop: string | symbol, mProp: string | symbol, args: any[]) {
  const globalMem = globalThis as any
  if (!globalMem.memoryTenders) globalMem.memoryTenders = []

  if (prop === 'tender') {
    if (mProp === 'findMany') return globalMem.memoryTenders
    if (mProp === 'count') return globalMem.memoryTenders.length
    if (mProp === 'deleteMany') {
      globalMem.memoryTenders = []
      return { count: 0 }
    }
    if (mProp === 'create') {
      const data = args[0]?.data
      if (data) {
        const newItem = { ...data, id: `ghost-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, createdAt: new Date() }
        globalMem.memoryTenders.unshift(newItem) // 放在最前面
        return newItem
      }
    }
    if (mProp === 'update') {
      const id = args[0]?.where?.id
      const data = args[0]?.data
      const index = globalMem.memoryTenders.findIndex((t: any) => t.id === id)
      if (index !== -1 && data) {
        globalMem.memoryTenders[index] = { ...globalMem.memoryTenders[index], ...data }
        return globalMem.memoryTenders[index]
      }
    }
    if (mProp === 'findFirst') {
      const where = args[0]?.where
      if (where && globalMem.memoryTenders) {
        return globalMem.memoryTenders.find((t: any) => 
          t.agency === where.agency && 
          t.title === where.title && 
          t.releaseDate === where.releaseDate
        ) || null
      }
      return null
    }
  }
  
  if (prop === 'keyword') {
    if (mProp === 'findMany') return [...mockTargetKeywords, ...mockNegativeKeywords].map(k => ({
      id: k.id,
      word: k.term,
      type: k.id.startsWith('k') ? 'positive' : 'negative',
      createdAt: new Date(k.createdAt)
    }))
  }

  if (prop === 'config') {
    if (mProp === 'findMany') return globalMem.memoryConfigs || []
    if (mProp === 'findUnique' || mProp === 'findFirst') {
      const key = args[0]?.where?.key
      return (globalMem.memoryConfigs || []).find((c: any) => c.key === key) || null
    }
    if (mProp === 'upsert') {
      const key = args[0]?.where?.key
      const updateData = args[0]?.update
      const createData = args[0]?.create
      
      if (!globalMem.memoryConfigs) globalMem.memoryConfigs = []
      const index = globalMem.memoryConfigs.findIndex((c: any) => c.key === key)
      
      if (index !== -1) {
        globalMem.memoryConfigs[index] = { ...globalMem.memoryConfigs[index], ...updateData }
        return globalMem.memoryConfigs[index]
      } else {
        const newItem = { ...createData }
        globalMem.memoryConfigs.push(newItem)
        return newItem
      }
    }
  }

  if (prop === 'crawlerLog') {
    if (mProp === 'findMany') return globalMem.memoryLogs || []
    if (mProp === 'create') {
      const data = args[0]?.data
      if (data) {
        const newItem = { 
          ...data, 
          id: `log-${Date.now()}`, 
          createdAt: new Date(),
          fetchedCount: data.fetchedCount || 0,
          filteredCount: data.filteredCount || 0
        }
        if (!globalMem.memoryLogs) globalMem.memoryLogs = []
        globalMem.memoryLogs.unshift(newItem)
        return newItem
      }
    }
  }

  if (prop === 'user') {
    if (mProp === 'findMany') return globalMem.memoryUsers || []
    if (mProp === 'create') {
      const data = args[0]?.data
      if (data) {
        const newUser = { ...data, id: `user-${Date.now()}`, createdAt: new Date() }
        if (!globalMem.memoryUsers) globalMem.memoryUsers = []
        globalMem.memoryUsers.push(newUser)
        return newUser
      }
    }
    if (mProp === 'delete') {
      const id = args[0]?.where?.id
      if (id && globalMem.memoryUsers) {
        const deletedItem = globalMem.memoryUsers.find((u: any) => u.id === id)
        globalMem.memoryUsers = globalMem.memoryUsers.filter((u: any) => u.id !== id)
        return deletedItem || { id }
      }
    }
  }

  if (prop === 'recipient') {
    const globalMem = globalThis as any
    if (mProp === 'findMany') {
      return globalMem.memoryRecipients || []
    }
    if (mProp === 'findUnique' || mProp === 'findFirst') {
      const id = args[0]?.where?.id
      return (globalMem.memoryRecipients || []).find((r: any) => r.id === id) || null
    }
    if (mProp === 'create') {
      const data = args[0]?.data
      if (data) {
        const newItem = { ...data, id: `rec-${Date.now()}`, createdAt: new Date() }
        if (!globalMem.memoryRecipients) globalMem.memoryRecipients = []
        globalMem.memoryRecipients.push(newItem)
        return newItem
      }
    }
    if (mProp === 'update' || mProp === 'updateMany') {
      const id = args[0]?.where?.id
      const data = args[0]?.data
      console.log(`[Ghost Update] ID: ${id}, New Status:`, data?.isEnabled)
      if (globalMem.memoryRecipients && id) {
        const index = globalMem.memoryRecipients.findIndex((r: any) => String(r.id) === String(id))
        if (index !== -1 && data) {
          globalMem.memoryRecipients[index] = { ...globalMem.memoryRecipients[index], ...data }
          console.log(`[Ghost Update] Success! Updated ID: ${id}`)
          return globalMem.memoryRecipients[index]
        }
      }
      return { count: 1 }
    }
    if (mProp === 'delete' || mProp === 'deleteMany') {
      const id = args[0]?.where?.id
      console.log(`[Ghost Delete] Target ID: ${id}`)
      console.log(`[Ghost Delete] Current Memory IDs:`, (globalMem.memoryRecipients || []).map((r:any) => r.id))
      
      if (id && globalMem.memoryRecipients) {
        const deletedItem = globalMem.memoryRecipients.find((r: any) => String(r.id) === String(id))
        globalMem.memoryRecipients = globalMem.memoryRecipients.filter((r: any) => String(r.id) !== String(id))
        if (deletedItem) {
          console.log(`[Ghost Delete] Success! Removed ID: ${id}`)
        } else {
          console.log(`[Ghost Delete] Failed: ID ${id} not found in memory.`)
        }
        return deletedItem || { id }
      }
      return { count: 1 }
    }
  }

  return []
}
