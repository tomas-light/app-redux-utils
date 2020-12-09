# 
* [install](#Installation)
* [usage](#How to use)
* [controllers](#Using controllers)
* [redux-saga](#Using with redux-saga)


### <a name="install"></a> Installation

```bush
npm install app-redux-utils
```

### <a name="usage"></a> How to use

```ts
// User.store.ts
import { User } from './User';

export class UserStore {
  users: User[];
  usersAreLoading: boolean;
}
```

```ts
// Users.actions.ts
import { createAction, createActionWithCallback } from "app-redux-utils";
import { UsersStore } from "./Users.store";

export interface LoadUserData {
  userId: number;
}

export class UsersActions {
  public static readonly PREFIX = "USERS_";
  public static readonly UPDATE_STORE = UsersActions.PREFIX + "UPDATE_STORE";

  public static readonly LOAD_USERS = UsersActions.PREFIX + "LOAD_USERS";
  public static readonly LOAD_USER = UsersActions.PREFIX + "LOAD_USER";
  public static readonly LOAD_CURRENT_USER = UsersActions.PREFIX + "LOAD_CURRENT_USER";
  public static readonly LOAD_SOMETHING_ELSE = UsersActions.PREFIX + "LOAD_SOMETHING_ELSE";

  public static updateStore = (partialStore: Partial<UsersStore>) =>
    createAction(UsersActions.UPDATE_STORE, partialStore);

  public static loadUsers = () =>
    createAction(UsersActions.LOAD_USERS);

  public static loadUser = (data: LoadUserData) =>
    createAction(UsersActions.LOAD_USER, data);

  public static loadCurrentUser = () =>
    createActionWithCallback(UsersActions.LOAD_CURRENT_USER);

  public static loadSomethingElse = () =>
    createAction(UsersActions.LOAD_SOMETHING_ELSE);
}
```

```ts
// UsersPageContainer.ts
import { ComponentType } from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { UsersActions } from "./Users.actions";
import { IUsersPageCallProps, UsersPage } from "./UsersPage";

const mapDispatchToProps = (dispatch: Dispatch): IUsersPageCallProps => {
  return {
    loadUsers: () => dispatch(UsersActions.loadUsers()),
    loadUser: (userId: number) => dispatch(UsersActions.loadUser({ userId })),
    loadCurrentUser: () => dispatch(
      UsersActions.loadCurrentUser()(
        () => UsersActions.loadSomethingElse()
      )
    ),
  };
};

const UsersPageContainer: ComponentType = connect(
  null,
  mapDispatchToProps
)(UsersPage);

export { UsersPageContainer };
```

```ts
// Users.reducer.ts
import { Reducer } from "app-redux-utils";

import { UsersActions } from "./Users.actions";
import { UsersStore } from "./Users.store";

export const UsersReducer = Reducer(new UsersStore(), UsersActions.UPDATE_STORE);
```

```ts
// State.ts
import { UsersStore } from "./Users.store";
import { SomeStore } from "./Some.store";

export class State {
  public usersStore: UsersStore;
  public someStore: SomeStore;
}
```

```ts
// getReducers.ts
import { ReducersMapObject } from "redux";
import { State } from "./State";
import { UsersReducer } from "./Users.reducer";
import { SomeReducer } from "./Some.reducer";

export function getReducers(): ReducersMapObject<State, any> {
  return {
    usersStore: UsersReducer,
    someStore: SomeReducer,
  };
}
```

```ts
// configureApp.ts
import { createReducers } from "app-redux-utils";
import { applyMiddleware, compose, createStore, Store } from "redux";

import { State } from "./State";
import { getReducers } from "./getReducers";

export function configureApp(): Store<State> {
  const composeEnhancer = window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] || compose;
  const store: Store<State> = createStore(
    createReducers(getReducers),
    composeEnhancer(applyMiddleware())
  );

  return store;
}
```

### <a name="controllers"></a> Using controllers

```ts
// User.controller.ts
import { ControllerBase } from 'app-redux-utils';
import { State } from "./State";
import { UsersActions } from "./Users.actions";
import { UsersStore } from "./Users.store";

export class UserController extends ControllerBase<State> {
  private updateStore(partialStore: Partial<UsersStore>) {
    this.dispatch(UsersActions.updateStore(partialStore));
  }

  async loadUsers() {
    this.updateStore({
      usersAreLoading: true,
    });

    const response = await fetch('/api/users');
    if (!response.ok) {
      this.updateStore({
        usersAreLoading: false,
      });

      // show error notification or something elase
      return;
    }

    const users = await response.json();
    
    this.updateStore({
      usersAreLoading: false,
      users,
    });
  }
}

```

```ts
// User.watcher.ts
import { watcher } from 'app-saga-utils';

import { UserActions } from './User.actions';
import { UserController } from './User.controller';

export const UserWatcher = watcher<UserController>(
  UserController,
  [
    [
      UserActions.LOAD_USERS,
      'loadUsers',
    ],
  ]);
```

```ts
// controllerWatchers.ts
import { Watcher } from 'app-saga-utilsr';
import { State } from "./State";
import { UserWatcher } from '/User.watcher';

const controllerWatchers: Watcher<State>[] = [
  UserWatcher,
  // rest watchers
];

export { controllerWatchers };
```

```ts
// configureApp.ts
import { createReducers, controllerMiddleware } from "app-redux-utils";
import { applyMiddleware, compose, createStore, Store } from "redux";

import { controllerWatchers } from "./controllerWatchers";
import { State } from "./State";
import { getReducers } from "./getReducers";

export function configureApp(): Store<State> {
  const composeEnhancer = window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] || compose;
  const store: Store<State> = createStore(
    createReducers(getReducers),
    composeEnhancer(applyMiddleware()),
    controllerMiddleware(controllerWatchers) // here we connect middleware
  );

  return store;
}
```

### <a name="redux-saga"></a> Using with redux-saga

```ts
// Users.saga.ts
import { put } from "@redux-saga/core/effects";
import { Action } from "app-redux-utils";

import { UsersApi } from "@api/UsersApi";
import { UsersActions, ILoadUserData } from "../redux/Users.actions";
import { UsersStore } from "../redux/Users.store";

export class UsersSaga {
  private static* updateStore(partialStore: Partial<UsersStore>) {
    yield put(UsersActions.updateStore(partialStore));
  }

  public static* loadUsers(action: Action) {
    // some logic ...

    yield UsersSaga.updateStore({
      users: [],
    });
  }

  public static* loadUser(action: Action<ILoadUserData>) {
    // some logic ...

    const response = yield UsersApi.getUserById(action.payload.userId);

    yield UsersSaga.updateStore({
      openedUser: response.data,
    });
  }

  // other sagas...
}
```

```ts
// Users.watcher.ts

import { SagaMiddleware } from "redux-saga";
import { ForkEffect, put, PutEffect, TakeEffect, takeLatest } from "@redux-saga/core/effects";
import { Action } from "app-redux-utils";

import { UsersActions } from "../redux/Users.actions";
import { UsersSaga } from "./Users.saga";

type WatchFunction = () => IterableIterator<ForkEffect | TakeEffect | PutEffect>;

export class UsersWatcher {
  public watchFunctions: WatchFunction[];

  constructor() {
    this.watchFunctions = [];

    this.watchLatest(
      UsersActions.LOAD_USERS,
      UsersSaga.loadUsers
    );
    this.watchLatest(
      UsersActions.LOAD_USER,
      UsersSaga.loadUser
    );
    this.watchLatest(
      UsersActions.LOAD_CURRENT_USER,
      UsersSaga.loadCurrentUser
    );
  }

  private getSagaWithCallbackAction(saga: (action: Action) => void): (action: Action) => void {
    return function* (action: Action) {
      yield saga(action);

      if (!action.stopPropagation) {
        const actions = action.getActions();
        const putActionEffects = actions.map(action => put(action()));
        yield all(putActionEffects);
      }
    };
  }

  private watchLatest(actionType: string, saga: (action: Action) => void) {
    const sagaWithCallbackAction = this.getSagaWithCallbackAction(saga);
    this.watchFunctions.push(
      function* () {
        yield takeLatest(actionType, sagaWithCallbackAction);
      }
    );
  }

  public run(sagaMiddleware: SagaMiddleware) {
    this.watchFunctions.forEach(saga => sagaMiddleware.run(saga));
  }
}
```

```ts
// configureApp.ts
import { createReducers } from "app-redux-utils";
import { applyMiddleware, compose, createStore, Store } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";

import { State } from "./State";
import { getReducers } from "./getReducers";
import { UsersWatcher } from "./Users.watcher";

export function configureApp(): Store<State> {
  const sagaMiddleware: SagaMiddleware = createSagaMiddleware();
  const middleware = applyMiddleware(
    sagaMiddleware
  );

  const composeEnhancer = window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"] || compose;
  const store: Store<State> = createStore(
    createReducers(getReducers),
    composeEnhancer(middleware)
  );

  const watcher = new UsersWatcher();
  watcher.run(sagaMiddleware);

  return store;
}
```
