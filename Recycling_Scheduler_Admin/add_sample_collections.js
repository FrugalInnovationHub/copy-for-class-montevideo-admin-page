import { db } from './firebase.js';
import { collection, doc, setDoc } from 'firebase/firestore';

const clientId = "3e0040d7-2497-4327-90aa-aec7a09b1f28";

// Sample collection data with various materials
const sampleCollections = [
  {
    clientId: clientId,
    collections: [
      { materialId: "plastico_pet", weight: 15.5 },
      { materialId: "plastico_hdpe", weight: 8.2 },
      { materialId: "papel_carton", weight: 22.3 }
    ],
    timeStamp: new Date("2024-10-15"),
    createdAt: new Date("2024-10-15"),
    location: { latitude: -34.9011, longitude: -56.1645 },
    status: "completed"
  },
  {
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", weight: 18.7 },
      { materialId: "papel_blanco", weight: 5.3 },
      { materialId: "organico", weight: 12.4 }
    ],
    timeStamp: new Date("2024-10-20"),
    createdAt: new Date("2024-10-20"),
    location: { latitude: -34.9015, longitude: -56.1650 },
    status: "completed"
  },
  {
    clientId: clientId,
    collections: [
      { materialId: "plastico_pet", weight: 20.1 },
      { materialId: "organico", weight: 15.8 },
      { materialId: "descarte", weight: 3.5 }
    ],
    timeStamp: new Date("2024-10-25"),
    createdAt: new Date("2024-10-25"),
    location: { latitude: -34.9020, longitude: -56.1655 },
    status: "completed"
  },
  {
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", weight: 25.6 },
      { materialId: "plastico_hdpe", weight: 11.2 },
      { materialId: "plastico_ldpe", weight: 7.8 }
    ],
    timeStamp: new Date("2024-10-28"),
    createdAt: new Date("2024-10-28"),
    location: { latitude: -34.9025, longitude: -56.1660 },
    status: "completed"
  }
];

async function addSampleCollections() {
  console.log(`Adding ${sampleCollections.length} sample collections for client: ${clientId}`);
  
  try {
    for (const collectionData of sampleCollections) {
      const collectionRef = collection(db, "collections");
      const docRef = doc(collectionRef); // auto-generate ID
      
      await setDoc(docRef, collectionData);
      console.log(`✓ Added collection with ID: ${docRef.id}`);
    }
    
    console.log('\n✅ Successfully added all sample collections!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding collections:', error);
    process.exit(1);
  }
}

addSampleCollections();

