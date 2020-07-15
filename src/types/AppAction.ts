import { IAppAction } from "./IAppAction";
import { CallbackAction } from "./CallbackAction";

export class AppAction<TPayload = any> implements IAppAction<TPayload> {
    type: any;
    payload?: TPayload;

    callbackAction?: CallbackAction;
    actions?: AppAction[];
    stopPropagation?: boolean;

    constructor(type: string, payload?: TPayload) {
        this.type = type;
        this.payload = payload;
        this.actions = [];
        this.stopPropagation = false;
    }

    stop(): void {
        this.stopPropagation = true;
    }

    getActions(): CallbackAction[] {
        const actions: CallbackAction[] = [];

        if (typeof this.callbackAction === "function") {
            actions.push(this.callbackAction);
        }

        if (Array.isArray(this.actions) && this.actions.length > 0) {
            this.actions.forEach(action => {
                actions.push(() => action);
            });
        }

        return actions;
    }
}
