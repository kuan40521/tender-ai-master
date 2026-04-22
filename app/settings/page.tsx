import { PageHeader } from "@/components/page-header"
import { RecipientManager } from "@/components/settings/recipient-manager"
import { AlertRules } from "@/components/settings/alert-rules"

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="系統設定與通知"
        description="管理系統參數、收件人清單與情報推播規則。所有變更將即時生效。"
      />

      <div className="grid grid-cols-1 gap-5 px-4 py-5 md:px-6 md:py-6 xl:grid-cols-2">
        <RecipientManager />
        <AlertRules />
      </div>
    </div>
  )
}
