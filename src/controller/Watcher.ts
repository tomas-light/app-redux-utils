import { Store } from 'redux';

import { Action } from '../types';
import { Controller } from './Controller';
import { ControllerBase } from './ControllerBase';

export type Watcher<TState, TController extends Controller = any> = {
  has: (actionType: string) => boolean;
  get: (actionType: string) => keyof TController | undefined;
  instance: (reduxStore: Store<TState, Action>) => ControllerBase<TState>;
};

export function watcher<TState, TController extends Controller = any>(
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
