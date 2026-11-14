export interface SeededRandom {
  next: () => number
  int: (maxExclusive: number) => number
  shuffle: <T>(values: readonly T[]) => T[]
  pick: <T>(values: readonly T[]) => T
}

function hashSeed(seed: string) {
  let hash = 0x811c9dc5

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

export function createSeededRandom(seed: string): SeededRandom {
  let state = hashSeed(seed || 'football-ec-company')

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }

  const int = (maxExclusive: number) => {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error('maxExclusive phải là số nguyên dương.')
    }
    return Math.floor(next() * maxExclusive)
  }

  const shuffle = <T>(values: readonly T[]) => {
    const result = [...values]
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = int(index + 1)
      ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
    }
    return result
  }

  const pick = <T>(values: readonly T[]) => {
    if (values.length === 0) throw new Error('Không thể chọn từ danh sách rỗng.')
    return values[int(values.length)]
  }

  return { next, int, shuffle, pick }
}
