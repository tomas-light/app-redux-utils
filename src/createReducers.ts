import { combineReducers, Reducer, ReducersMapObject } from "redux";

export function createReducers<TReducers>(
    getReducers: (...params: any) => ReducersMapObject<TReducers, any>,
    ...params: any
): Reducer<TReducers> {

    const reducers = getReducers.apply(null, params);
    return combineReducers<TReducers>(reducers);
}
