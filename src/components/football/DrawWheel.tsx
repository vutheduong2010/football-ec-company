import type { Player } from '../../types/player'
import { getPlayerDisplayName } from '../../features/players/playerDisplay'

const TEAM_COLORS = ['#22c55e', '#60a5fa', '#fb923c'] as const
const WHEEL_SIZE = 320
const CENTER = WHEEL_SIZE / 2
const RADIUS = 112
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface WheelPlayer {
  player: Player
  teamIndex: number
}

function shortName(player: Player) {
  const label = getPlayerDisplayName(player)
  return label.length > 12 ? `${label.slice(0, 11)}…` : label
}

export function DrawWheel({
  players,
  status,
  currentPlayer,
  latestPlayer,
}: {
  players: WheelPlayer[]
  status: 'idle' | 'spinning' | 'paused' | 'completed'
  currentPlayer: WheelPlayer | null
  latestPlayer: WheelPlayer | null
}) {
  const sliceLength = players.length === 0 ? CIRCUMFERENCE : CIRCUMFERENCE / players.length
  const gap = Math.min(2.5, sliceLength * 0.12)
  const isRotating = status === 'spinning' || status === 'paused'
  const centerPlayer = status === 'completed' ? latestPlayer : currentPlayer

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]" aria-hidden="true">
      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
        <div className="h-0 w-0 border-x-[11px] border-t-[22px] border-x-transparent border-t-white drop-shadow-lg" />
      </div>
      <svg
        viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
        className={`h-full w-full drop-shadow-[0_20px_45px_rgba(0,0,0,0.35)] ${isRotating ? 'wheel-rotating' : ''} ${status === 'paused' ? 'wheel-paused' : ''}`}
      >
        <circle cx={CENTER} cy={CENTER} r="154" fill="#080f1c" stroke="#25334a" strokeWidth="2" />
        {players.map(({ player, teamIndex }, index) => {
          const angle = (360 / players.length) * index - 90
          const textAngle = angle + 360 / players.length / 2
          const radians = (textAngle * Math.PI) / 180
          const textRadius = players.length > 16 ? 117 : 112
          const x = CENTER + Math.cos(radians) * textRadius
          const y = CENTER + Math.sin(radians) * textRadius
          const readableRotation = textAngle > 90 && textAngle < 270 ? textAngle + 180 : textAngle

          return (
            <g key={player.id}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={TEAM_COLORS[teamIndex]}
                strokeOpacity={index % 2 === 0 ? 0.92 : 0.68}
                strokeWidth="84"
                strokeDasharray={`${Math.max(0, sliceLength - gap)} ${CIRCUMFERENCE}`}
                transform={`rotate(${angle} ${CENTER} ${CENTER})`}
              />
              <text
                x={x}
                y={y}
                fill="#f8fafc"
                fontSize={players.length > 18 ? 6.5 : players.length > 12 ? 7.5 : 9}
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${readableRotation} ${x} ${y})`}
              >
                {shortName(player)}
              </text>
            </g>
          )
        })}
        <circle cx={CENTER} cy={CENTER} r="67" fill="#07101d" stroke="#334155" strokeWidth="2" />
        <circle cx={CENTER} cy={CENTER} r="56" fill="#0b1728" stroke="#ffffff18" strokeWidth="1" />
      </svg>

      <div className="pointer-events-none absolute inset-0 grid place-items-center px-[32%] text-center">
        <div className="min-w-0">
          <span
            className="mx-auto mb-1.5 block size-2.5 rounded-full"
            style={{
              backgroundColor: centerPlayer ? TEAM_COLORS[centerPlayer.teamIndex] : '#64748b',
            }}
          />
          <p className="truncate text-[10px] font-black text-white sm:text-xs">
            {status === 'idle'
              ? 'Sẵn sàng'
              : status === 'completed'
                ? 'Hoàn tất'
                : centerPlayer
                  ? getPlayerDisplayName(centerPlayer.player)
                  : 'Đang chọn'}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
            {status === 'paused'
              ? 'Đã tạm dừng'
              : status === 'spinning'
                ? 'Đang quay'
                : 'Football EC'}
          </p>
        </div>
      </div>
    </div>
  )
}
