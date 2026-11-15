import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { AuthProvider } from './app/AuthProvider'

function renderApp(initialEntries = ['/']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('App', () => {
  it('hiển thị trang chủ và hành động chính', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Ra sân là phải cân đội.' })).toBeVisible()
    expect(screen.getByRole('link', { name: /Chia đội ngay/ })).toHaveAttribute('href', '/draw')
  })

  it('lọc danh sách cầu thủ mẫu theo từ khóa', async () => {
    const user = userEvent.setup()
    renderApp(['/players'])

    await user.type(screen.getByRole('searchbox', { name: 'Tìm tên hoặc biệt danh' }), 'Cầu thủ 14')

    expect(screen.getByText('Cầu thủ 14')).toBeVisible()
    expect(screen.queryByText('Cầu thủ 01')).not.toBeInTheDocument()
  })

  it('hiển thị trang 404 cho route không tồn tại', () => {
    renderApp(['/khong-ton-tai'])

    expect(screen.getByRole('heading', { name: 'Bóng đã ra ngoài sân' })).toBeVisible()
  })

  it('hiển thị lịch sử và chi tiết kết quả mẫu cho viewer', () => {
    const { unmount } = renderApp(['/results'])
    expect(screen.getByRole('heading', { name: 'Lịch sử thi đấu' })).toBeVisible()
    expect(screen.getByText('Kèo tối thứ Năm')).toBeVisible()
    expect(screen.getByLabelText('Tỉ số 3 - 1')).toBeVisible()
    expect(screen.getByLabelText('Thắng')).toHaveTextContent('W')
    expect(screen.getByLabelText('Thua')).toHaveTextContent('L')
    expect(screen.getByRole('button', { name: 'Nhập kết quả Kèo tối thứ Năm' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Xóa kết quả Kèo tối thứ Năm' })).toBeDisabled()
    unmount()

    renderApp(['/results/demo-1211'])
    expect(screen.getByRole('heading', { name: 'Kèo tối thứ Năm' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Tải PNG/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Xóa kết quả' })).toBeDisabled()
    expect(screen.getByLabelText('Sơ đồ sân 7 đội A')).toBeVisible()
    expect(screen.getByText(/Kéo cầu thủ trên sân hoặc ảnh đại diện trong danh sách/)).toBeVisible()
  })

  it('cho viewer mở tab chia đội ở chế độ chỉ xem', () => {
    renderApp(['/draw'])

    expect(screen.getByRole('heading', { name: 'Chia đội' })).toBeVisible()
    expect(screen.getByText('Chế độ minh họa')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Bỏ chọn' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Chọn tất cả' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Xem trước chia đội' })).toBeDisabled()
  })
})
