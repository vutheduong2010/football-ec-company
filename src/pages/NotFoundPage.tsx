import { ArrowLeft, Goal } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buttonClass } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center sm:py-20">
      <Card className="relative overflow-hidden px-5 py-12 sm:px-10 sm:py-16">
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[130px] font-black leading-none text-white/[0.025] sm:text-[180px]">
          404
        </span>
        <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-orange-400/10 text-orange-300 ring-1 ring-orange-400/20">
          <Goal className="size-7" />
        </span>
        <h1 className="relative mt-5 text-2xl font-black text-white sm:text-3xl">
          Bóng đã ra ngoài sân
        </h1>
        <p className="relative mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Trang bạn tìm không tồn tại hoặc đường dẫn đã thay đổi.
        </p>
        <Link to="/" className={buttonClass('primary', 'relative mt-6')}>
          <ArrowLeft className="size-4" /> Quay về trang chủ
        </Link>
      </Card>
    </div>
  )
}
