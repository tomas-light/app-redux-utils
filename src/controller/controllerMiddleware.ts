import { Store } from 'redux';
import { Container } from 'cheap-di';
import { AbstractStore } from '../AbstractStore';
import { MetadataStorage } from '../MetadataStorage';
import {
  Action,
  CallbackAction,
  isAction,
} from '../types';
import { Watcher } from './Watcher';

function controllerMiddleware<State>(watchers: Watcher<State, any>[], container?: Container) {
  return (reduxStore: Store<State, Action>) => (next: (action: Action) => void) => async (action: Action) => {
    next(action);

    let createController: (watcher: Watcher<any, any>) => any;
    if (container) {
      container.registerInstance(reduxStore).as(AbstractStore);
      createController = (watcher: Watcher<any, any>) => {
        const internalDependencies = (container as any as { dependencies: Map<any, any> }).dependencies;
        if (internalDependencies && !internalDependencies.has(watcher.type)) {
          container.registerType(watcher.type);
        }

        return container.resolve(watcher.type);
      };
    }
    else {
      createController = (watcher: Watcher<any, any>) => watcher.instance(reduxStore) as any;
    }

    if (!isAction(action)) {
      return;
    }

    const generator = controllerGenerator(watchers, createController, action);

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
  createController: (watcher: Watcher<any, any>) => any,
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

    const implicitWatchers = MetadataStorage.getImplicitWatchers();
    const allWatchers = watchers.concat(implicitWatchers);

    allWatchers.forEach(watcher => {
      const actionName = watcher.get(action.type);
      if (actionName) {
        const controller = createController(watcher);
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
