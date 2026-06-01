import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDpqIP2y0ZBWjAcknp1szptkyh0fk6zGQI",
  authDomain: "tournamentsoftware-a1b3d.firebaseapp.com",
  projectId: "tournamentsoftware-a1b3d",
  storageBucket: "tournamentsoftware-a1b3d.appspot.com",
  messagingSenderId: "659831913509",
  appId: "1:659831913509:web:1295743f7e5becfcaf13cc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.testFirestore = async () => {

  const snapshot =
    await getDocs(collection(db, 'tournaments'));

  console.log(
    'count:',
    snapshot.docs.length
  );

  console.log(
    snapshot.docs.slice(0, 3).map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  );

  return snapshot.docs.length;

};
