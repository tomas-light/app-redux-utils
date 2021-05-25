import { createAction } from '../createAction';
import { Action } from '../types';
import { ControllerBase } from './ControllerBase';
import { controllerMiddleware } from './controllerMiddleware';
import { watcher } from './Watcher';

const ACTIONS = {
  actionA1: 'ACTION_A_1',
  actionA2: 'ACTION_A_2',
  actionA3: 'ACTION_A_3',

  actionB1: 'ACTION_B_1',
  actionB2: 'ACTION_B_2',
  actionB3: 'ACTION_B_3',
};

class _Controller extends ControllerBase<any> {
  calledMethods: string[] = [];
  kind: string = '';

  method1() {
    this.calledMethods.push(`${this.kind}1`);
  }

  method2() {
    this.calledMethods.push(`${this.kind}2`);
  }

  method3() {
    this.calledMethods.push(`${this.kind}3`);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  }
}

function makeMiddleware(calledMethods: string[]) {
  class ControllerA extends _Controller {
    calledMethods = calledMethods;
    kind = 'A';
  }

  class ControllerB extends _Controller {
    calledMethods = calledMethods;
    kind = 'B';
  }

  const watchersA = watcher<any, ControllerA>(ControllerA, [
    [ACTIONS.actionA1, 'method1'],
    [ACTIONS.actionA2, 'method2'],
    [ACTIONS.actionA3, 'method3'],
  ]);
  const watchersB = watcher<any, ControllerB>(ControllerB, [
    [ACTIONS.actionB1, 'method1'],
    [ACTIONS.actionB2, 'method2'],
    [ACTIONS.actionB3, 'method3'],
  ]);

  return controllerMiddleware([watchersA, watchersB]);
}

test('simple action', done => {
  const calledMethods: string[] = [];
  const nextCalled: string[] = [];
  const next = jest.fn((action: Action) => {
    nextCalled.push(action.type);
  });

  const middleware = makeMiddleware(calledMethods);
  const handleAction = middleware({} as any)(next);

  const simpleAction = createAction(ACTIONS.actionA1);
  handleAction(simpleAction).then(() => {
    expect(nextCalled.length).toBe(1);
    expect(nextCalled[0]).toBe(ACTIONS.actionA1);

    expect(calledMethods.length).toBe(1);
    expect(calledMethods[0]).toBe('A1');

    done();
  });
});

test('2 simple actions', done => {
  const calledMethods: string[] = [];
  const nextCalled: string[] = [];
  const next = jest.fn((action: Action) => {
    nextCalled.push(action.type);
  });

  const middleware = makeMiddleware(calledMethods);
  const handleAction = middleware({} as any)(next);

  const simpleAction1 = createAction(ACTIONS.actionA1);
  const simpleAction2 = createAction(ACTIONS.actionB1);
  Promise.all([
    handleAction(simpleAction1),
    handleAction(simpleAction2),
  ]).then(() => {
    expect(nextCalled.length).toBe(2);
    expect(nextCalled[0]).toBe(ACTIONS.actionA1);
    expect(nextCalled[1]).toBe(ACTIONS.actionB1);

    expect(calledMethods.length).toBe(2);
    expect(calledMethods[0]).toBe('A1');
    expect(calledMethods[1]).toBe('B1');

    done();
  });
});

test('3 consistent actions', done => {
  const calledMethods: string[] = [];

  const nextCalled: string[] = [];
  const next = jest.fn((action: Action) => {
    nextCalled.push(action.type);
  });

  const middleware = makeMiddleware(calledMethods);
  const handleAction = middleware({} as any)(next);

  const action = createAction(ACTIONS.actionA1);
  action.actions = [
    createAction(ACTIONS.actionA2),
  ];
  action.callbackAction = () => createAction(ACTIONS.actionB1);

  handleAction(action).then(() => {
    expect(calledMethods.length).toBe(3);
    expect(calledMethods[0]).toBe('A1');
    expect(calledMethods[1]).toBe('B1');
    expect(calledMethods[2]).toBe('A2');

    expect(nextCalled.length).toBe(1);

    done();
  });
});

test('3 consistent actions with promises', done => {
  const calledMethods: string[] = [];

  const nextCalled: string[] = [];
  const next = jest.fn((action: Action) => {
    nextCalled.push(action.type);
  });

  const middleware = makeMiddleware(calledMethods);
  const handleAction = middleware({} as any)(next);

  const action = createAction(ACTIONS.actionA1);
  action.actions = [
    createAction(ACTIONS.actionA2),
  ];
  action.callbackAction = () => createAction(ACTIONS.actionA3);

  handleAction(action).then(() => {
    expect(calledMethods.length).toBe(3);
    expect(calledMethods[0]).toBe('A1');
    expect(calledMethods[1]).toBe('A3');
    expect(calledMethods[2]).toBe('A2');

    expect(nextCalled.length).toBe(1);

    done();
  });
});

test('5 consistent actions with promises an stop propagation', done => {
  const calledMethods: string[] = [];

  const nextCalled: string[] = [];
  const next = jest.fn((action: Action) => {
    nextCalled.push(action.type);
  });

  const middleware = makeMiddleware(calledMethods);
  const handleAction = middleware({} as any)(next);

  const action = createAction(ACTIONS.actionA1);

  const bAction = createAction(ACTIONS.actionB1);
  bAction.stopPropagation = true;
  bAction.actions = [
    createAction(ACTIONS.actionB2),
    createAction(ACTIONS.actionB3),
  ];

  action.actions = [
    createAction(ACTIONS.actionA2),
    bAction,
  ];
  action.callbackAction = () => createAction(ACTIONS.actionA3);

  handleAction(action).then(() => {
    expect(calledMethods.length).toBe(4);
    expect(calledMethods[0]).toBe('A1');
    expect(calledMethods[1]).toBe('A3');
    expect(calledMethods[2]).toBe('A2');
    expect(calledMethods[3]).toBe('B1');

    expect(nextCalled.length).toBe(1);

    done();
  });
});
