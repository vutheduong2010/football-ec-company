import { AlertTriangle, Inbox, LoaderCircle, WifiOff } from 'lucide-react'

import { Button } from './Button'
import { Card } from './Card'

type StateType = 'empty' | 'error' | 'offline' | 'loading'

const stateMeta = {
  empty: {
    icon: Inbox,
    title: 'Chưa có dữ liệu',
    description: 'Nội dung sẽ xuất hiện tại đây khi sẵn sàng.',
  },
  error: {
    icon: AlertTriangle,
    title: 'Không thể tải dữ liệu',
    description: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
  },
  offline: {
    icon: WifiOff,
    title: 'Bạn đang ngoại tuyến',
    description: 'Kiểm tra kết nối mạng để nhận dữ liệu mới nhất.',
  },
  loading: {
    icon: LoaderCircle,
    title: 'Đang tải dữ liệu',
    description: 'Chỉ mất một chút thời gian.',
  },
} satisfies Record<StateType, { icon: typeof Inbox; title: string; description: string }>

export function StatusState({ type, compact = false }: { type: StateType; compact?: boolean }) {
  const meta = stateMeta[type]
  const Icon = meta.icon

  return (
    <Card className={`text-center ${compact ? 'p-5' : 'px-5 py-10'}`}>
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white/6 text-slate-400">
        <Icon
          className={`size-5 ${type === 'loading' ? 'animate-spin motion-reduce:animate-none' : ''}`}
        />
      </span>
      <h2 className="mt-3 text-sm font-extrabold text-white">{meta.title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{meta.description}</p>
      {type === 'error' && (
        <Button variant="secondary" className="mt-4">
          Thử lại
        </Button>
      )}
    </Card>
  )
}
