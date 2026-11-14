import { describe, expect, it } from 'vitest'

import { APP_NAME, GITHUB_PAGES_BASE } from './config'

describe('cấu hình ứng dụng', () => {
  it('dùng đúng tên sản phẩm và đường dẫn GitHub Pages', () => {
    expect(APP_NAME).toBe('Football EC Company')
    expect(GITHUB_PAGES_BASE).toBe('/football-ec-company/')
  })
})
