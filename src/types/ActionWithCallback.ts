import { IAppAction } from "./IAppAction";
import { CallbackAction } from "./CallbackAction";

export type ActionWithCallback = (callbackAction: CallbackAction) => IAppAction;
