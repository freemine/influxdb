// Libraries
import React, {FC, useContext, useEffect} from 'react'
import {SubmitQueryButton} from 'src/timeMachine/components/SubmitQueryButton'
import QueryProvider, {
  QueryContext,
  BothResults,
  SubmitQueryButtonContext,
} from 'src/notebooks/context/query'
import {NotebookContext, PipeMeta} from 'src/notebooks/context/notebook'
import {TimeContext} from 'src/notebooks/context/time'
import {IconFont} from '@influxdata/clockface'

// Types
import {RemoteDataState} from 'src/types'

const PREVIOUS_REGEXP = /__PREVIOUS_RESULT__/g
const COMMENT_REMOVER = /(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm

export const Submit: FC = () => {
  const {query} = useContext(QueryContext)
  const {onNotify} = useContext(SubmitQueryButtonContext)
  const {id, pipes, updateResult, updateMeta} = useContext(NotebookContext)
  const {timeContext} = useContext(TimeContext)
  const time = timeContext[id]

  useEffect(() => {
    submit()
  }, [!!time && time.range])

  const submit = () => {
    pipes
      .reduce((stages, pipe, index) => {
        updateMeta(index, {loading: RemoteDataState.Loading} as PipeMeta)

        if (pipe.type === 'query') {
          let text = pipe.queries[pipe.activeQuery].text.replace(
            COMMENT_REMOVER,
            ''
          )
          let requirements = {}

          if (PREVIOUS_REGEXP.test(text)) {
            requirements = {
              ...(index === 0 ? {} : stages[stages.length - 1].requirements),
              [`prev_${index}`]: stages[stages.length - 1].text,
            }
            text = text.replace(PREVIOUS_REGEXP, `prev_${index}`)
          }

          stages.push({
            text,
            instances: [index],
            requirements,
          })
        } else if (stages.length) {
          stages[stages.length - 1].instances.push(index)
        }

        return stages
      }, [])
      .map(queryStruct => {
        const queryText =
          Object.entries(queryStruct.requirements)
            .map(([key, value]) => `${key} = (\n${value}\n)\n\n`)
            .join('') + queryStruct.text

        return query(queryText)
          .then(response => {
            queryStruct.instances.forEach(index => {
              updateMeta(index, {loading: RemoteDataState.Done} as PipeMeta)
              updateResult(index, response)
            })
          })
          .catch(e => {
            queryStruct.instances.forEach(index => {
              updateMeta(index, {loading: RemoteDataState.Error} as PipeMeta)
              updateResult(index, {
                error: e.message,
              } as BothResults)
            })
          })
      })
  }

  return (
    <SubmitQueryButton
      text="Run Flow"
      onNotify={onNotify}
      icon={IconFont.Play}
      submitButtonDisabled={false}
      queryStatus={RemoteDataState.NotStarted}
      onSubmit={submit}
    />
  )
}

export default () => (
  <QueryProvider>
    <Submit />
  </QueryProvider>
)
