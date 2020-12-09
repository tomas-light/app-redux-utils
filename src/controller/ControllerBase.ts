import { Dispatch, Store } from 'redux';

import { Action } from '../types';
import { Controller } from './Controller';

export abstract class ControllerBase<TState> implements Controller {
  constructor(reduxStore: Store<TState, Action>) {
    if (new.target === ControllerBase) {
      throw new Error('Cannot construct ControllerBase instance directly');
    }

    this.dispatch = reduxStore.dispatch;
    this.getState = () => reduxStore.getState();
  }

  protected readonly dispatch: Dispatch<Action>;
  protected readonly getState: () => TState;
}
