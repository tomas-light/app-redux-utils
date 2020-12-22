import { Action } from './Action';
import { CallbackAction } from './CallbackAction';

export type ActionWithCallback = (callbackAction: CallbackAction) => Action;
