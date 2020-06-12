// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Components
import {
  Button,
  ComponentColor,
  ComponentSize,
  ComponentStatus,
  IconFont,
} from '@influxdata/clockface'

// Actions
import {saveAndExecuteQueries} from 'src/timeMachine/actions/queries'
import {notify} from 'src/shared/actions/notifications'

// Utils
import {getActiveTimeMachine, getActiveQuery} from 'src/timeMachine/selectors'
import {queryCancelRequest} from 'src/shared/copy/notifications'

// Types
import {RemoteDataState} from 'src/types'
import {AppState} from 'src/types'

interface StateProps {
  submitButtonDisabled: boolean
  queryStatus: RemoteDataState
}

interface DispatchProps {
  onSubmit: typeof saveAndExecuteQueries | (() => void)
  onNotify: typeof notify | (() => void)
}

interface OwnProps {
  text?: string
  icon?: IconFont
  testID?: string
}

type Props = OwnProps & StateProps & DispatchProps

class SubmitQueryButton extends PureComponent<Props> {
  public static defaultProps = {
    text: 'Submit',
    testID: 'time-machine-submit-button',
  }

  public render() {
    const {text, queryStatus, icon, testID} = this.props

    if (queryStatus === RemoteDataState.Loading) {
      return (
        <Button
          text="Cancel"
          icon={icon}
          size={ComponentSize.Small}
          status={ComponentStatus.Default}
          onClick={() => this.handleCancelClick()}
          color={ComponentColor.Danger}
          testID={testID}
        />
      )
    }
    return (
      <Button
        text={text}
        icon={icon}
        size={ComponentSize.Small}
        status={this.buttonStatus}
        onClick={this.handleClick}
        color={ComponentColor.Primary}
        testID={testID}
      />
    )
  }

  private get buttonStatus(): ComponentStatus {
    const {queryStatus, submitButtonDisabled} = this.props

    if (submitButtonDisabled) {
      return ComponentStatus.Disabled
    }

    if (queryStatus === RemoteDataState.Loading) {
      return ComponentStatus.Loading
    }

    return ComponentStatus.Default
  }

  private abortController: AbortController

  private handleClick = (): void => {
    // We need to instantiate a new AbortController per request
    // In order to allow for requests after cancellations:
    // https://stackoverflow.com/a/56548348/7963795
    this.abortController = new AbortController()
    this.props.onSubmit(this.abortController)
  }

  private handleCancelClick = (): void => {
    this.props.onNotify(queryCancelRequest())
    this.abortController.abort()
  }
}

export {SubmitQueryButton}

const mstp = (state: AppState) => {
  const submitButtonDisabled = getActiveQuery(state).text === ''
  const queryStatus = getActiveTimeMachine(state).queryResults.status

  return {submitButtonDisabled, queryStatus}
}

const mdtp = {
  onSubmit: saveAndExecuteQueries,
  onNotify: notify,
}

export default connect<StateProps, DispatchProps>(
  mstp,
  mdtp
)(SubmitQueryButton)
