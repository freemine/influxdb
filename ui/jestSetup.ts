import {cleanup} from '@testing-library/react'
import 'intersection-observer'
import MutationObserver from 'mutation-observer'
import fetchMock from 'jest-fetch-mock'

// Adds MutationObserver as a polyfill for testing
window.MutationObserver = MutationObserver

fetchMock.enableMocks()
jest.mock('honeybadger-js', () => () => null)

process.env.API_PREFIX = 'http://example.com/'
// cleans up state between @testing-library/react tests
afterEach(() => {
  cleanup()
})
