import { AppAction } from "./AppAction";

export function createAction(actionType: string, data: any = {}): AppAction {
    let payload;

    if (typeof data === "object" && !Array.isArray(data)) {
        payload = { ...data };
    }
    else {
        payload = data;
    }

    return {
        type: actionType,
        payload,
    };
}

export function createActionWithCallback(
    actionType: string, data: any = {}
): (
    callbackAction?: () => AppAction
) => AppAction {

    const action = createAction(actionType, data);
    const actionWithCallback = (callbackAction?: () => AppAction): AppAction => {
        if (typeof callbackAction === "function") {
            return {
                ...action,
                callbackAction,
            };
        }
        return action;
    };

    return actionWithCallback;
}
