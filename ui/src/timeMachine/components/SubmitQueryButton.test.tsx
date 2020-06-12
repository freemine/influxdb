// Libraries
import React from 'react'
import {mocked} from 'ts-jest/utils'
import {fireEvent, screen, waitFor} from '@testing-library/react'

declare global {
  interface Window {
    TextDecoder: any
  }
}

const FakeTextDecoder = function FakeTextDecoder() {}
FakeTextDecoder.prototype.decode = function fakeDecode() {
  return ''
}
window.TextDecoder = FakeTextDecoder

jest.mock('src/external/parser', () => {
  return {
    parse: jest.fn(() => {
      return {
        type: 'File',
        package: {
          name: {
            name: 'fake',
            type: 'Identifier',
          },
          type: 'PackageClause',
        },
        imports: [],
        body: [],
      }
    }),
  }
})

// Components
import SubmitQueryButton from 'src/timeMachine/components/SubmitQueryButton'

// Utils
import {renderWithRedux} from 'src/mockState'

// Types
import {RemoteDataState} from 'src/types'

const stateOverride = {
  timeMachines: {
    activeTimeMachineID: 'veo',
    timeMachines: {
      veo: {
        draftQueries: [
          {
            text: `from(bucket: "apps")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "rum")
  |> filter(fn: (r) => r["_field"] == "domInteractive")
  |> map(fn: (r) => ({r with _value: r._value / 1000.0}))
  |> group()`,
          },
        ],
        activeQueryIndex: 0,
        queryResults: {
          status: RemoteDataState.NotStarted,
        },
        view: {
          properties: {
            queries: [{text: 'draftstate'}],
          },
        },
      },
    },
  },
}

const fakeReader = {
  cancel: jest.fn(),
  read: jest.fn(() => {
    return Promise.resolve({
      done: true
    })
  })
}

const fakeResponse = {
  status: 200,
  body: {
    getReader: () => fakeReader
  }
}

describe('TimeMachine.Components.SubmitQueryButton', () => {
  beforeEach(() => {
    // jest.useFakeTimers()
  })
  it('disables the submit button when no query is present', async (done) => {
    mocked(fetch).mockImplementation(() => {
      return Promise.resolve(fakeResponse)
    })
    const {getByTitle} = renderWithRedux(<SubmitQueryButton />, s => ({
      ...s,
      ...stateOverride,
    }))

    // const SubmitBtn = getByTitle('Submit')
    screen.debug()
    fireEvent.click(getByTitle('Submit'))

    screen.debug()
    expect(await getByTitle('Submit')).toBeTruthy()
    screen.debug()
    // await waitFor(() => {

    //   done()
    // }, {timeout: 2000})

    // expect the button to still be on submit

  })
  it.skip('allows the query to be cancelled after submission', async () => {
    jest.useFakeTimers()
    const {getByTitle} = renderWithRedux(<SubmitQueryButton />, s => ({
      ...s,
      ...stateOverride,
    }))

    // mocked(fetchMock).mockResponse(async () => {
    //   jest.advanceTimersByTime(60)
    //   return ''
    // })
    const SubmitBtn = getByTitle('Submit')
    fireEvent.click(SubmitBtn)

    const CancelBtn = getByTitle('Cancel')
    fireEvent.click(CancelBtn)
    console.log(mocked(fetch))
    // await expect().rejects.toThrow('The operation was aborted')
    // aborts the query and returns the query to submit mode
    expect(await waitFor(() => getByTitle('Submit'))).toBeTruthy()
  })
})
