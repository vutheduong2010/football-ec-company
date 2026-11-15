import { describe, expect, it } from 'vitest'

import type { PlayerInput } from '../../types/player'
import { normalizePlayerInput, validatePlayerInput } from './playerValidation'

const validInput: PlayerInput = {
  name: 'Cầu thủ Test',
  nickname: 'Test',
  seed: 1,
  primaryPosition: 'CM',
  secondaryPositions: ['CB', 'ST'],
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
      validatePlayerInput({ ...validInput, secondaryPositions: ['CB', 'ST', 'LB'] })
        .secondaryPositions,
    ).toBeTruthy()
  })

  it('chấp nhận đủ ba hạt giống và từ chối giá trị ngoài danh sách', () => {
    expect(validatePlayerInput({ ...validInput, seed: 3 })).toEqual({})
    expect(validatePlayerInput({ ...validInput, seed: 4 as never }).seed).toBeTruthy()
  })

  it('chuẩn hóa khoảng trắng và biệt danh rỗng', () => {
    expect(
      normalizePlayerInput({ ...validInput, name: '  Cầu thủ Test  ', nickname: '   ' }),
    ).toMatchObject({ name: 'Cầu thủ Test', nickname: undefined })
  })
})
