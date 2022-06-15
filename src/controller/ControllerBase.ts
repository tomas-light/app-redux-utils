import { Dispatch } from 'redux';
import { Middleware } from '../Middleware';

import { Action, Controller } from '../types';

export abstract class ControllerBase<TState> implements Controller {
  protected readonly dispatch: Dispatch<Action>;
  protected readonly getState: () => TState;

  constructor(middleware: Middleware<TState>) {
    if (new.target === ControllerBase) {
      throw new Error('Cannot construct ControllerBase instance directly');
    }

    this.dispatch = middleware.dispatch;
    this.getState = () => middleware.getState();
  }
}
