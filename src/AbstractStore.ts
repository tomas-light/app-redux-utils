import { Store, Dispatch, Observable, Reducer, Unsubscribe } from 'redux';
import { Action } from './types';

abstract class AbstractStore<State> implements Store<State, Action> {
  abstract dispatch: Dispatch<Action>;

  abstract [Symbol.observable](): Observable<State>;

  abstract getState(): State;

  abstract replaceReducer(nextReducer: Reducer<State, Action>): void;

  abstract subscribe(listener: () => void): Unsubscribe;
}

export { AbstractStore };
