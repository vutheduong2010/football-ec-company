import { Dices, House, Trophy, Users } from 'lucide-react'

export const navigation = [
  { label: 'Trang chủ', shortLabel: 'Trang chủ', to: '/', icon: House },
  { label: 'Thành viên', shortLabel: 'Cầu thủ', to: '/players', icon: Users },
  { label: 'Chia đội', shortLabel: 'Chia đội', to: '/draw', icon: Dices },
  { label: 'Kết quả', shortLabel: 'Kết quả', to: '/results', icon: Trophy },
] as const
