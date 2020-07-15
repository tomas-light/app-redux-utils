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

    static stop(appAction: IAppAction): void {
        appAction.stopPropagation = true;
    }

    static getActions(appAction: IAppAction): CallbackAction[] {
        const actions: CallbackAction[] = [];

        if (typeof appAction.callbackAction === "function") {
            actions.push(appAction.callbackAction);
        }

        if (Array.isArray(appAction.actions) && appAction.actions.length > 0) {
            appAction.actions.forEach(action => {
                actions.push(() => action);
            });
        }

        return actions;
    }

    stop(): void {
        AppAction.stop(this);
    }

    getActions(): CallbackAction[] {
        return AppAction.getActions(this);
    }

    toPlainObject(): IAppAction {
        const keys = Object.keys(this);
        const plainObject: IAppAction = {} as any;

        keys.forEach(key => {
            if (key !== "toPlainObject") {
                // @ts-ignore
                plainObject[key] = this[key];
            }
        });

        plainObject.stop = function() {
            AppAction.stop(this);
        }
        plainObject.getActions = function () {
            return AppAction.getActions(this);
        }

        return plainObject;
    }
}
