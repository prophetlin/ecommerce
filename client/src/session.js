import API from './api';

// Functions related to storing user session information

const storage = window.sessionStorage

// user token getter/setter and autherization header constructor
export function setToken(token) {
	storage.setItem('token', token);
}

export function getToken() {
    return storage.getItem('token');
}

export function removeToken() {
    storage.removeItem('token');
}

export function authHeader() {
    return getToken() ? 
        { Authorization: `Bearer ${getToken()}`} : {};
}

// user email getter/setter
export function setEmail(email) {
    storage.setItem('email', email);
}

export function getEmail() {
    return storage.getItem('email');
}

// admin setter/checker
export function setAdmin() {
    storage.setItem('admin', true);
}

export function isAdmin() {
    return storage.hasOwnProperty('admin');
}

// clear session
export function clearSession() {
    storage.clear();
}

// cart setter/getter
export function setCartNum(num) {
    storage.setItem('cartNum', num)
}

export function getCartNum() {
    return storage.getItem('cartNum');
}

export function IncrementCartNum() {
    if (getCartNum())
        storage.setItem('cartNum', parseInt(getCartNum())+1)
}

export function DecrementCartNum() {
    if (getCartNum())
        storage.setItem('cartNum', parseInt(getCartNum())-1)
}

// fetch and cache options data, return promise resolved with options data
export function getOptions() {
    // if in cache return options
    const opt = storage.getItem('options');
    if (opt) return Promise.resolve(JSON.parse(opt));
    // else fetch options
    const api = new API();
    return api.getJSON("options", authHeader())
            .then(r => {
                storage.setItem('options', JSON.stringify(r));
                return r;
            });
}

// admin data getter/setter
export function getAdminData(data) {
    return storage.getItem('adminData');
}

export function setAdminData(data) {
    storage.setItem('adminData', data);
}