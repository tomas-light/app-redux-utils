import { Action as ReduxAction } from "redux";
import { CallbackAction } from "./CallbackAction";

export interface Action<TPayload = {}> extends ReduxAction {
    payload: TPayload;

    callbackAction?: CallbackAction;
    actions?: Action[];
    stopPropagation?: boolean;

    stop(): void;
    getActions(): CallbackAction[];
}
