import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

async function inspectFirebaseData() {
  console.log('='.repeat(80));
  console.log('INSPECTING FIREBASE DATA');
  console.log('='.repeat(80));
  
  try {
    // 1. Fetch the specific collection record
    console.log('\n📦 FETCHING COLLECTION RECORD: 5QiEV9fQRycQoL8CBPOh\n');
    const collectionRef = doc(db, "collections", "5QiEV9fQRycQoL8CBPOh");
    const collectionSnap = await getDoc(collectionRef);
    
    if (collectionSnap.exists()) {
      const collectionData = collectionSnap.data();
      console.log('Collection Data:');
      console.log(JSON.stringify(collectionData, null, 2));
      console.log('\n');
    } else {
      console.log('❌ Collection document not found!');
    }
    
    // 2. Fetch all materials
    console.log('\n' + '='.repeat(80));
    console.log('📋 FETCHING ALL MATERIALS\n');
    const materialsRef = collection(db, "materials");
    const materialsSnap = await getDocs(materialsRef);
    
    if (materialsSnap.empty) {
      console.log('⚠️  No materials found in the materials collection');
    } else {
      console.log(`Found ${materialsSnap.size} materials:\n`);
      materialsSnap.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Data: ${JSON.stringify(data, null, 2)}`);
        console.log('-'.repeat(40));
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ INSPECTION COMPLETE');
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inspecting data:', error);
    process.exit(1);
  }
}

inspectFirebaseData();

