import { db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function listClients() {
  try {
    const querySnapshot = await getDocs(collection(db, 'clients'));
    console.log('='.repeat(80));
    console.log('CURRENT FIRESTORE CLIENTS:');
    console.log('='.repeat(80));
    querySnapshot.forEach((doc) => {
      console.log(`ID: ${doc.id}`);
      console.log(`Name: ${doc.data().client_name}`);
      console.log(`Logo File: ${doc.data().logo_file || '(Not set)'}`);
      console.log('-'.repeat(40));
    });
    process.exit(0);
  } catch (e) {
    console.error('Error fetching clients:', e);
    process.exit(1);
  }
}

listClients();
