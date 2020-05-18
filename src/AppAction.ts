import { AnyAction } from "redux";

export type AppAction<T = any> = AnyAction & {
    payload: T;
    callbackAction?: () => AppAction;
};
