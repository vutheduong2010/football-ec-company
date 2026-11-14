import { POSITIONS, type PlayerInput, type Position } from '../../types/player'

export type PlayerValidationErrors = Partial<
  Record<'name' | 'nickname' | 'seed' | 'primaryPosition' | 'secondaryPositions', string>
>

export function validatePlayerInput(input: PlayerInput): PlayerValidationErrors {
  const errors: PlayerValidationErrors = {}
  const name = input.name.trim()
  const nickname = input.nickname?.trim() ?? ''

  if (!name) errors.name = 'Tên cầu thủ là bắt buộc.'
  else if (name.length > 80) errors.name = 'Tên tối đa 80 ký tự.'

  if (nickname.length > 50) errors.nickname = 'Biệt danh tối đa 50 ký tự.'
  if (input.seed !== 1 && input.seed !== 2) errors.seed = 'Hạt giống phải là 1 hoặc 2.'
  if (!POSITIONS.includes(input.primaryPosition))
    errors.primaryPosition = 'Vị trí chính không hợp lệ.'

  const uniqueSecondary = new Set(input.secondaryPositions)
  if (input.secondaryPositions.length > 2) {
    errors.secondaryPositions = 'Chỉ được chọn tối đa 2 vị trí phụ.'
  } else if (uniqueSecondary.size !== input.secondaryPositions.length) {
    errors.secondaryPositions = 'Vị trí phụ không được trùng nhau.'
  } else if (input.secondaryPositions.includes(input.primaryPosition)) {
    errors.secondaryPositions = 'Vị trí phụ không được trùng vị trí chính.'
  } else if (input.secondaryPositions.some((position) => !POSITIONS.includes(position))) {
    errors.secondaryPositions = 'Có vị trí phụ không hợp lệ.'
  }

  return errors
}

export function normalizePlayerInput(input: PlayerInput): PlayerInput {
  return {
    ...input,
    name: input.name.trim(),
    nickname: input.nickname?.trim() || undefined,
    secondaryPositions: [...new Set(input.secondaryPositions)] as Position[],
  }
}
