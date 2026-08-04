import { db } from './firebase.js';
import { collection, doc, setDoc, Timestamp, deleteDoc, getDocs, query, where } from 'firebase/firestore';

const clientId = "3e0040d7-2497-4327-90aa-aec7a09b1f28";

// Sample location UUID (you can change this to a real location ID from your database)
const sampleLocationId = "05f334d4-9747-431d-abcd-7d17956013ad";

// Properly formatted collection data matching your database structure
const properCollections = [
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 8, weight: 35.5 },
      { materialId: "plasticos", count: 12, weight: 18.2 }
    ],
    location: sampleLocationId
  },
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 15, weight: 45.8 },
      { materialId: "papel_carton", count: 5, weight: 22.0 }
    ],
    location: sampleLocationId
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 20, weight: 28.5 },
      { materialId: "otros", count: 3, weight: 8.5 },
      { materialId: "descarte", count: 2, weight: 5.0 }
    ],
    location: sampleLocationId
  },
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 10, weight: 42.0 },
      { materialId: "organico", count: 8, weight: 30.5 }
    ],
    location: sampleLocationId
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 18, weight: 24.8 },
      { materialId: "papel_carton", count: 6, weight: 28.5 },
      { materialId: "organico", count: 10, weight: 38.2 }
    ],
    location: sampleLocationId
  }
];

async function deleteOldCollections() {
  console.log('🗑️  Deleting old sample collections...\n');
  const oldIds = [
    'S5J1yO0LH8OyvSI3R2oF',
    'eX3zT8sXZ3CAqvQZXLMj',
    'P6u7aBFXgl3wBtraSqxp',
    'JSHlqPHU3lnO1uO3HnTb'
  ];
  
  for (const id of oldIds) {
    try {
      await deleteDoc(doc(db, "collections", id));
      console.log(`  ✓ Deleted collection: ${id}`);
    } catch (error) {
      console.log(`  ⚠️  Could not delete ${id}: ${error.message}`);
    }
  }
  console.log('');
}

async function addProperCollections() {
  console.log('=' .repeat(80));
  console.log('ADDING PROPERLY FORMATTED COLLECTIONS');
  console.log('='.repeat(80));
  console.log(`\nClient ID: ${clientId}`);
  console.log(`Location ID: ${sampleLocationId}`);
  console.log(`Adding ${properCollections.length} collections\n`);
  
  try {
    // First delete the old incorrectly formatted ones
    await deleteOldCollections();
    
    console.log('➕ Adding new properly formatted collections...\n');
    
    const now = Timestamp.now();
    
    for (let i = 0; i < properCollections.length; i++) {
      const collectionData = properCollections[i];
      const collectionRef = collection(db, "collections");
      const docRef = doc(collectionRef); // auto-generate ID
      
      // Add the ID to the data (as seen in your example)
      const dataToSave = {
        ...collectionData,
        id: docRef.id,
        createdAt: now,
        timeStamp: now,
        updatedAt: now
      };
      
      await setDoc(docRef, dataToSave);
      
      console.log(`  ✓ Collection ${i + 1}/${properCollections.length}`);
      console.log(`    ID: ${docRef.id}`);
      console.log(`    Classified: ${collectionData.classified}`);
      console.log(`    Materials: ${collectionData.collections.map(c => `${c.materialId} (${c.weight}kg)`).join(', ')}`);
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('✅ Successfully added all properly formatted collections!');
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addProperCollections();

