import React from 'react'
import { render, screen } from '@testing-library/react'
import { SliceHeader } from '@/components/review/SliceHeader'

describe('SliceHeader sticky behavior (render)', () => {
  it('renders a rowheader with sticky class', () => {
    render(
      <table>
        <tbody>
          <SliceHeader title="Sections" id="slice-sections" />
        </tbody>
      </table>
    )

    const row = screen.getByRole('rowheader', { name: /sections section/i })
    expect(row).toBeInTheDocument()
    expect(row).toHaveClass('sticky')
  })
})
