import { IAppAction } from "./IAppAction";

function Reducer<TStore>(initialStore: TStore, updateActionType: string) {
    return (
        store: TStore = initialStore,
        action: IAppAction
    ): TStore => {
        if (action.type === updateActionType) {
            return {
                ...store,
                ...action.payload,
            };
        }

        return store;
    };
}

export { Reducer };
