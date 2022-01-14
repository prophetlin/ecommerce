import { firebase_app } from '../base.js';
import { UPLOAD_FIREBASE_FAIL, UPLOAD_FIREBASE_REQUEST, UPLOAD_FIREBASE_SUCCESS } from '../constants/uploadConstants.js';

export const uploadFirebase = (file) => async (dispatch) => {

    dispatch({ type: UPLOAD_FIREBASE_REQUEST});
    try {

        const storageRef = firebase_app.storage().ref();
        const fileRef = storageRef.child(file.name);
        fileRef.put(file).then(snapshot => {
            snapshot.ref.getDownloadURL().then(url => {
                console.log(' * new url', url)
              })
            
        })

        dispatch({ type: UPLOAD_FIREBASE_SUCCESS, payload: {}})
    } catch (error) {
        dispatch({ type: UPLOAD_FIREBASE_FAIL, payload: {message: 'firebase upload fail'} })
    }

}