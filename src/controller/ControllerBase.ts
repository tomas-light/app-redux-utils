import { Dispatch, Store } from 'redux';

import { Action, Controller } from '../types';

export abstract class ControllerBase<TState> implements Controller {
  protected readonly dispatch: Dispatch<Action>;
  protected readonly getState: () => TState;

  constructor(reduxStore: Store<TState, Action>) {
    if (new.target === ControllerBase) {
      throw new Error('Cannot construct ControllerBase instance directly');
    }

    this.dispatch = reduxStore.dispatch;
    this.getState = () => reduxStore.getState();
  }
}
