import { Store } from 'redux';
import {
  Action,
  CallbackAction,
  isAction,
} from '../types';
import { Watcher } from './Watcher';

function controllerMiddleware<TState>(watchers: Watcher<TState, any>[]) {
  return (reduxStore: Store<TState, Action>) => (next: (action: Action) => void) => async (action: Action) => {
    next(action);

    if (!isAction(action)) {
      return;
    }

    const generator = controllerGenerator(watchers, reduxStore, action);

    let iterator: IteratorResult<Promise<any>>;
    do {
      iterator = generator.next();
      if (!iterator.done) {
        try {
          await iterator.value;
        }
        catch (error) {
          console.error('Unhandled exception in controller', error);
        }
      }
    }
    while (!iterator.done);
  };
}

function controllerGenerator(
  watchers: Watcher<any, any>[],
  reduxStore: Store<any, Action>,
  initAction: Action,
): IterableIterator<Promise<any>> {
  let actionCursor = 0;
  const actions: CallbackAction[] = [() => initAction];

  function iterator(): IteratorResult<Promise<any>> {
    if (actionCursor >= actions.length) {
      return {
        value: undefined,
        done: true,
      };
    }

    const action = actions[actionCursor]();
    const promises: Promise<void>[] = [];

    watchers.forEach(watcher => {
      const actionName = watcher.get(action.type);
      if (actionName) {
        const controller = watcher.instance(reduxStore) as any;
        promises.push(
          controller[actionName](action)
        );
      }
    });

    actionCursor++;

    return {
      value: Promise.all(promises).then(() => {
        if (isAction(action) && !action.stopPropagation) {
          actions.splice(actionCursor, 0, ...action.getActions());
        }
      }),
      done: false,
    };
  }

  return {
    [Symbol.iterator](): IterableIterator<any> {
      return this;
    },
    next(): IteratorResult<Promise<any>> {
      return iterator();
    },
  };
}

export { controllerMiddleware };
