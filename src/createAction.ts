import { Action } from "./types";
import { AppAction } from "./types/AppAction";

export function createAction(actionType: string, payload: any = {}): Action {
    let _payload;

    if (typeof payload === "object" && !Array.isArray(payload)) {
        _payload = { ...payload };
    }
    else {
        _payload = payload;
    }

    return new AppAction(actionType, _payload).toPlainObject();
}
