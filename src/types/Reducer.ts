import { AppAction } from "./AppAction";

function Reducer<TStore>(initialStore: TStore, updateActionType: string) {
    return (
        store: TStore = initialStore,
        action: AppAction
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
