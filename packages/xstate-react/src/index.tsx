import * as React from "react"

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1)

type Config = {
  name: string
  machine: any
  actions: (params: any) => any
  activities: (params: any) => any
}

// lib, returns Context.Provider, Context.
export default function reactXState<D>({
  name,
  machine,
  actions,
  activities
}: Config) {
  name = name || "defaultName"

  type Props = {}

  type State = {
    data: D
    value: any
  }

  const Context = React.createContext(name)

  class Provider extends React.Component<Props, State> {
    static displayName = `${capitalize(name)}Provider`

    actions: any
    activities: any
    actives: any

    constructor(props) {
      super(props)
      this.state = {
        data: null,
        value: machine.initialStateValue
      }

      const params = {
        transition: this.transition,
        dispatch: this.dispatch,
        update: this.update
      }

      this.actions = actions ? actions(params) : {}
      this.activities = activities ? activities(params) : {}

      // hold active activities
      this.actives = {}
    }

    componentDidMount() {
      // handle onEntry on start up
      for (const stateNode of machine.initialStateNodes) {
        this.handleAction(stateNode.config.onEntry)
      }
    }

    update = data => {
      this.setState({ data })
    }

    handleAction = (actionList: string | string[]) => {
      if (actionList) {
        if (Array.isArray(actionList)) {
          // actionList: array
          for (const action of actionList) {
            this.dispatch(action)
          }
        } else {
          // actionList: string
          this.dispatch(actionList)
        }
      }
    }

    // onEntry, onExit, actions
    dispatch = action => {
      const triggerableAction = this.actions[action]
      if (triggerableAction) {
        triggerableAction()
      }
    }

    // transition between states
    transition = (event, payload) => {
      const nextState = machine.transition(this.state.value, event)

      // actions
      this.handleAction(nextState.actions)

      // activities
      for (const activity of Object.keys(nextState.activities)) {
        const isActive = nextState.activities[activity]
        if (isActive) {
          // cancellable activities
          // Promise.race(this.activities[activity](), wait(10 * 1000))
        } else if (this.actives[activity]) {
          // end activity
        }
      }

      // set next state
      this.setState({ value: nextState.value })
    }

    render() {
      const value: any = {
        dispatch: this.dispatch,
        transition: this.transition,
        state: this.state.value,
        data: this.state.data
      }
      return (
        <Context.Provider value={value}>{this.props.children}</Context.Provider>
      )
    }
  }

  return {
    Consumer: Context.Consumer,
    Provider
  }
}