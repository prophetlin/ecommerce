// API functions for communication with backend

/**
 * Makes a fetch request to `path` with `options` and parses the response as JSON.
 */
const APIRequest = (path, options) => fetch(path, options)
  .then((res) => {
    if (res.status === 200) return res.json();
    return res.json().then((err) => {
      throw new Error(err.message);
    });
  });


/**
 * Use the methods in this API class to make calls to backend.
 */
export default class API {
  
  makeAPIRequest(path, options) {
    return APIRequest(`/api/${path}`, options);
  }

  postJSON(path, data = {}, headers = {}) {
    return this.makeAPIRequest(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
  }

  putJSON(path, data = {}, headers = {}) {
    return this.makeAPIRequest(path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
  }

  getJSON(path, headers = {}) {
    return this.makeAPIRequest(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  deleteJSON(path, headers = {}) {
    return this.makeAPIRequest(path, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }
}
