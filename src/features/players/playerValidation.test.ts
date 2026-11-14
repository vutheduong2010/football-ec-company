import { describe, expect, it } from 'vitest'

import type { PlayerInput } from '../../types/player'
import { normalizePlayerInput, validatePlayerInput } from './playerValidation'

const validInput: PlayerInput = {
  name: 'Cầu thủ Test',
  nickname: 'Test',
  seed: 1,
  primaryPosition: 'CM',
  secondaryPositions: ['CAM', 'ST'],
  isActive: true,
}

describe('playerValidation', () => {
  it('chấp nhận hồ sơ hợp lệ', () => {
    expect(validatePlayerInput(validInput)).toEqual({})
  })

  it('chặn vị trí phụ trùng vị trí chính hoặc vượt quá hai', () => {
    expect(
      validatePlayerInput({ ...validInput, secondaryPositions: ['CM'] }).secondaryPositions,
    ).toBeTruthy()
    expect(
      validatePlayerInput({ ...validInput, secondaryPositions: ['CAM', 'ST', 'LB'] })
        .secondaryPositions,
    ).toBeTruthy()
  })

  it('chuẩn hóa khoảng trắng và biệt danh rỗng', () => {
    expect(
      normalizePlayerInput({ ...validInput, name: '  Cầu thủ Test  ', nickname: '   ' }),
    ).toMatchObject({ name: 'Cầu thủ Test', nickname: undefined })
  })
})
