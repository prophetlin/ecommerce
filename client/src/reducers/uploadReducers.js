import { UPLOAD_FIREBASE_FAIL, UPLOAD_FIREBASE_REQUEST, UPLOAD_FIREBASE_SUCCESS } from "../constants/uploadConstants";

export const UploadFireBaseReducer = (state = {status:''}, action) =>{

    switch(action.type){
        case UPLOAD_FIREBASE_REQUEST:
            return {status: 'uploading'};
        case UPLOAD_FIREBASE_SUCCESS:
            return {status: 'uploaded'};
        case UPLOAD_FIREBASE_FAIL:
            return {status: 'uploadError'};

        default:
            return state;
    }
}