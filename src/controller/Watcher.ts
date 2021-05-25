import { Store } from 'redux';

import { Action } from '../types';
import { Controller } from './Controller';
import { ControllerBase } from './ControllerBase';

type Watcher<TState, TController extends Controller> = {
  has: (actionType: string) => boolean;
  get: (actionType: string) => (keyof TController) | undefined;
  instance: (reduxStore: Store<TState, Action>) => ControllerBase<TState>;
};

function watcher<TState, TController extends Controller>(
  Controller: new (reduxStore: Store<TState, Action>) => ControllerBase<TState>,
  watchList: [string, keyof TController][],
): Watcher<TState, TController> {

  const map = new Map<string, keyof TController>(watchList);

  return {
    has: (actionType: string) => map.has(actionType),
    get: (actionType: string) => map.get(actionType),
    instance: (reduxStore: Store<TState, Action>) => new Controller(reduxStore),
  };
}

export { watcher };
export type { Watcher };
