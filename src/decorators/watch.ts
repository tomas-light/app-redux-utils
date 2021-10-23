import { watcher } from '../controller';
import { createAction } from '../createAction';
import { MetadataStorage } from '../MetadataStorage';
import { controllerWatcherSymbol, watchersSymbol } from '../symbols';
import {
  Constructor,
  Controller,
  WatchedConstructor,
} from '../types';
import { InheritancePreserver } from './InheritancePreserver';

type Prototype<T = any> = {
  constructor: Constructor<T>;
}

// constructor
function watch<TConstructor extends Constructor>(constructor: TConstructor): TConstructor;
// method factory
function watch(actionType: string): (prototype: any, propertyKey: string) => void;
// method
function watch(prototype: any, propertyKey: string): void;

function watch(constructorOrActionType?: any) {
  if (arguments.length === 1 && typeof constructorOrActionType !== 'string') {
    return watchConstructor(constructorOrActionType as Constructor);
  }

  if (arguments.length === 3) {
    // eslint-disable-next-line  prefer-spread  prefer-rest-params
    return watchMethod().apply(null, arguments as any);
  }

  return watchMethod(constructorOrActionType as string);
}

function watchConstructor(constructor: Constructor) {
  const watched = InheritancePreserver.getModifiedConstructor<WatchedConstructor>(constructor);
  const watchers = watched[watchersSymbol];

  if (watchers) {
    // add action creators to static methods of the controller
    Object.keys(watchers).forEach(actionType => {
      const staticMethodName = extractMethodNameFromActionType(actionType, watched.name);
      (watched as any)[staticMethodName] = (payload?: any) => createAction(actionType, payload);
    });

    if (!watched[controllerWatcherSymbol]) {
      const watchList = Object.keys(watchers).map(actionType => (
        [
          actionType,
          watchers[actionType],
        ] as [string, string]
      ));
      watched[controllerWatcherSymbol] = watcher(watched, watchList);
      MetadataStorage.addImplicitWatcher(watched[controllerWatcherSymbol]!);
    }
  }

  return constructor;
}

function watchMethod(actionType?: string) {
  return function (prototype: Prototype, propertyKey: string) {
    let watched = InheritancePreserver.getModifiedConstructor<WatchedConstructor>(prototype.constructor);
    if (!watched) {
      watched = prototype.constructor;

      if (!watched[watchersSymbol]) {
        watched[watchersSymbol] = {};
      }
    }

    if (!actionType) {
      actionType = propertyKey;
    }

    actionType = makeActionType(prototype.constructor.name, actionType);

    const watchers = watched[watchersSymbol]!;
    if (!watchers[actionType]) {
      watchers[actionType] = propertyKey;
    }

    InheritancePreserver.constructorModified(watched ?? prototype.constructor);
  };
}

/** (MyController, action) => MyController_action */
function makeActionType(constructorName: string, actionTypeOrProperty: string) {
  return `${constructorName.replace('Controller', '')}_${actionTypeOrProperty}`;
}

/** MyController_action => action */
function extractMethodNameFromActionType(actionType: string, constructorName: string) {
  const nameWithoutPostfix = constructorName.replace('Controller', '');
  return actionType.replace(`${nameWithoutPostfix}_`, '');
}

export { watch };
