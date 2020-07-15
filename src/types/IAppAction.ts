import { AnyAction } from "redux";
import { CallbackAction } from "./CallbackAction";

export interface IAppAction<TPayload = any> extends AnyAction {
    payload?: TPayload;

    callbackAction?: CallbackAction;
    actions?: IAppAction[];
    stopPropagation?: boolean;
}
