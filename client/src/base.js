// init firebase api connection

import firebase from 'firebase';
import 'firebase/storage'

export const firebase_app = firebase.initializeApp({
    "projectId": "movieflix-b71c2",
    "appId": "1:852287054194:web:e9b468d8b31892ec62fdeb",
    "storageBucket": "movieflix-b71c2.appspot.com",
    "locationId": "australia-southeast1",
    "apiKey": "AIzaSyCIfVENN_qkFun4TMCZzx8Bclp0vJ8DqDg",
    "authDomain": "movieflix-b71c2.firebaseapp.com",
    "messagingSenderId": "852287054194",
    "measurementId": "G-12VFWQFGJL"
  });