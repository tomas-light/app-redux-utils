import { Store } from 'redux';

import { Action } from '../types';
import { Controller } from './Controller';
import { ControllerBase } from './ControllerBase';

type Watcher<State, TController extends Controller> = {
  has: (actionType: string) => boolean;
  get: (actionType: string) => (keyof TController) | undefined;
  instance: (reduxStore: Store<State, Action>) => ControllerBase<State>;
  type: new (reduxStore: Store<State, Action>, ...args: any[]) => ControllerBase<State>,
};

function watcher<State, TController extends Controller>(
  Controller: new (reduxStore: Store<State, Action>, ...args: any[]) => ControllerBase<State>,
  watchList: [string, keyof TController][],
): Watcher<State, TController> {

  const map = new Map<string, keyof TController>(watchList);

  return {
    has: (actionType: string) => map.has(actionType),
    get: (actionType: string) => map.get(actionType),
    instance: (reduxStore: Store<State, Action>) => new Controller(reduxStore),
    type: Controller,
  };
}

export { watcher };
export type { Watcher };
