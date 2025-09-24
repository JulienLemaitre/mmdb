import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReviewEditBanner from '@/components/review/ReviewEditBanner'
import { FEED_FORM_LOCAL_STORAGE_KEY } from '@/utils/constants'

// Allow per-test control of mocked state and router
let mockedState: any = { formInfo: { currentStepRank: 0 } }
const pushMock = jest.fn()

jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({ push: pushMock }),
  }
})

jest.mock('../components/context/feedFormContext', () => {
  return {
    useFeedForm: () => ({ state: mockedState }),
  }
})

describe('ReviewEditBanner', () => {
  beforeEach(() => {
    mockedState = { formInfo: { currentStepRank: 0 } }
    pushMock.mockReset()
    localStorage.clear()
  })

  it('does not render when not in review edit mode', () => {
    render(<ReviewEditBanner />)
    expect(screen.queryByText(/Edit mode within an in‑progress review/i)).not.toBeInTheDocument()
  })

  it('renders banner and navigates back to checklist with persisted state', () => {
    mockedState = {
      formInfo: {
        currentStepRank: 2,
        reviewContext: {
          reviewId: 'rev-123',
          reviewEdit: true,
          updatedAt: new Date().toISOString(),
        },
      },
      pieces: [],
    }

    render(<ReviewEditBanner />)

    // Banner is visible
    expect(
      screen.getByText(/Edit mode within an in‑progress review/i)
    ).toBeInTheDocument()

    // Click back
    const btn = screen.getByRole('button', { name: /Back to review/i })
    fireEvent.click(btn)

    // State was persisted
    const raw = localStorage.getItem(FEED_FORM_LOCAL_STORAGE_KEY)
    expect(raw).toBeTruthy()

    // Navigation executed
    expect(pushMock).toHaveBeenCalledWith('/review/rev-123/checklist')
  })
})
