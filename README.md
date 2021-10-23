* [install](#Installation)
* [usage](#How to use)
* [controllers](#Using controllers)
* [controllers-di](#Using controllers with cheap-di)
* [reduce-boilerplate](#Reduce boilerplate)
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
  static readonly PREFIX = "USERS_";
  static readonly UPDATE_STORE = `${UsersActions.PREFIX}UPDATE_STORE`;

  static readonly LOAD_USER_LIST = `${UsersActions.PREFIX}LOAD_USER_LIST`;
  static readonly LOAD_USER = `${UsersActions.PREFIX}LOAD_USER`;
  static readonly LOAD_CURRENT_USER = `${UsersActions.PREFIX}LOAD_CURRENT_USER`;
  static readonly LOAD_SOMETHING_ELSE = `${UsersActions.PREFIX}LOAD_SOMETHING_ELSE`;

  static updateStore = (partialStore: Partial<UsersStore>) =>
    createAction(UsersActions.UPDATE_STORE, partialStore);

  static loadUserList = () => createAction(UsersActions.LOAD_USER_LIST);
  static loadUser = (data: LoadUserData) => createAction(UsersActions.LOAD_USER, data);
  static loadCurrentUser = () => createActionWithCallback(UsersActions.LOAD_CURRENT_USER);
  static loadSomethingElse = () => createAction(UsersActions.LOAD_SOMETHING_ELSE);
}
```

```ts
// UsersPageContainer.ts
import { ComponentType } from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import { UsersActions } from "./Users.actions";
import { Props, UsersPage } from "./UsersPage";

const mapDispatchToProps = (dispatch: Dispatch): Props => ({
  loadUserList: () => dispatch(UsersActions.loadUserList()),
  loadUser: (userId: number) => dispatch(UsersActions.loadUser({ userId })),
  loadCurrentUser: () => dispatch(
    UsersActions.loadCurrentUser()(
      // this action will be dispatched after loadCurrentUser will be handled in controller
      () => UsersActions.loadSomethingElse()
    )
  ),
});

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
  const devtoolsComposer = window["__REDUX_DEVTOOLS_EXTENSION_COMPOSE__"];
  const composeEnhancer = devtoolsComposer || compose;

  const store: Store<State> = createStore(
    createReducers(getReducers),
    composeEnhancer(applyMiddleware())
  );

  return store;
}
```

### <a name="controllers"></a> Using controllers

Controller - is place for piece of logic in your application. 
It differences from Saga in redux-saga - your methods is not static! 
It allows you to use dependency injection technics and simplify tests in some cases. 

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

  async loadUserList() {
    this.updateStore({
      usersAreLoading: true,
    });

    const response = await fetch('/api/users');
    if (!response.ok) {
      this.updateStore({
        usersAreLoading: false,
      });

      // show error notification or something else
      return;
    }

    const users = await response.json();
    
    this.updateStore({
      usersAreLoading: false,
      users,
    });
  }
  
  loadUser(action: Action<LoadUserData>) {/* ... */}
  loadCurrentUser() {/* ... */}
  loadSomethingElse() {/* ... */}
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
      UserActions.LOAD_USER_LIST,
      'loadUserList', // typescript will check that this string corresponds to real method name in your controller
    ],
    [
      UserActions.LOAD_USER,
      'loadUser',
    ],
    //...
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
import { controllerMiddleware } from "app-redux-utils";
import { createStore, /* ... */ } from "redux";
import { controllerWatchers } from "./controllerWatchers";
// ...

export function configureApp(): Store<State> {
  // ...

  const store: Store<State> = createStore(
    // ...
    controllerMiddleware(controllerWatchers) // here we connect middleware
  );

  return store;
}
```

### <a name="controller-di"></a> Using controllers with cheap-di

```ts
// configureApp.ts
import { controllerMiddleware } from "app-redux-utils";
import { container } from 'cheap-di';
import { createStore, /* ... */ } from "redux";
import { controllerWatchers } from "./controllerWatchers";
// ...

export function configureApp(): Store<State> {
  // ...

  const store: Store<State> = createStore(
    // ...
    controllerMiddleware(controllerWatchers, container) // add container as second param
  );

  return store;
}
```

```ts
// User.controller.ts
import { ControllerBase, AbstractStore } from 'app-redux-utils';
import { State } from "./State";
import { UsersActions } from "./Users.actions";
import { UsersStore } from "./Users.store";
import { metadata } from "./metadata"; // read cheap-di README to know what is it

@metadata
export class UserController extends ControllerBase<State> {
  constructor(
    store: AbstractStore<State>,
    private readonly service: MyService
  ) {
    super(store);
  }
  // ...
}
```

```ts
// App.tsx
import { useEffect } from 'react';
import { container } from 'cheap-di';

const App = () => {
  useEffect(() => {
    container.registerType(MyService);
  }, []);

  return /* your layout */;
}
```

### <a name="reduce-boilerplate"></a> Reduce boilerplate

You can avoid boilerplate by using decorators

`MyController.ts`
```tsx
import { ControllerBase, DecoratedWatchedController, Reducer, createAction } from 'app-redux-utils';
import { useDispatch } from 'react-redux';

type State = {
  my: MyStore;
};

class MyStore {
  users: string[] = [];

  static update = 'My_update_store';
  static reducer = Reducer(new MyStore(), MyStore.update);
}

@watch
class MyController extends ControllerBase<State> {
  updateStore(store: Partial<MyStore>) {
    this.dispatch(createAction(MyStore.update, store));
  }

  @watch('openUserForEditing')
  openUser(action: Action<{ userID: string; }>) {
    //...
  }
}
const myController: DecoratedWatchedController<[
    'loadUsers' |
    ['openUserForEditing', { userID: string; }]
]> = MyController as any;

export { myController as MyController };
```

```tsx
import { useDispatch } from 'react-redux';
import { MyController } from './MyController';

const MyComponent = () => {
  const dispatch = useDispatch();
  
  dispatch(MyController.loadUsers());
  dispatch(MyController.openUserForEditing({ userID: '123' }));
  
  return <>beatiful button</>;
};
```

### <a name="redux-saga"></a> Using with redux-saga

```ts
// Users.saga.ts
import { Action } from "app-redux-utils";
import { LoadUserData } from "../redux/Users.actions";

export class UsersSaga {
  static * loadUserList() {/* ... */}
  static * loadUser(action: Action<LoadUserData>) {/* ... */}
  static * loadCurrentUser() {/* ... */}
  static * loadSomethingElse() {/* ... */}
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
import { applyMiddleware, createStore /* ... */ } from "redux";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";

import { State } from "./State";
import { getReducers } from "./getReducers";
import { UsersWatcher } from "./Users.watcher";

export function configureApp(): Store<State> {
  // ...

  const store: Store<State> = createStore(
    createReducers(getReducers),
    composeEnhancer(applyMiddleware(createSagaMiddleware()))
  );

  const watcher = new UsersWatcher();
  watcher.run(sagaMiddleware);

  return store;
}
```
