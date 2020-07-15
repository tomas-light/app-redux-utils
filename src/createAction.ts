import { AppAction } from "./types";

export function createAction(actionType: string, payload: any = {}): AppAction {
    let _payload;

    if (typeof payload === "object" && !Array.isArray(payload)) {
        _payload = { ...payload };
    }
    else {
        _payload = payload;
    }

    return new AppAction(actionType, _payload);
}
