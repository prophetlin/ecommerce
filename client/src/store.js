// init firebase connection state

import {
    applyMiddleware,
    combineReducers,
    compose,
    createStore
} from 'redux';
import thunk from 'redux-thunk';

import { UploadFireBaseReducer } from './reducers/uploadReducers';

const initialState = {};


const reducer = combineReducers({
    UploadFireBase: UploadFireBaseReducer
})

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    reducer,
    initialState,
    composeEnhancer(applyMiddleware(thunk)));
export default store;