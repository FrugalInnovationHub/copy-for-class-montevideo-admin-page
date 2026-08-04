import { db } from './firebase.js';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const clientId = "3e0040d7-2497-4327-90aa-aec7a09b1f28";
const sampleLocationId = "05f334d4-9747-431d-abcd-7d17956013ad";

// Collections data for 2025 with various dates throughout the year
const collections2025 = [
  // January 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 12, weight: 45.3 },
      { materialId: "plasticos", count: 15, weight: 22.5 },
      { materialId: "organico", count: 8, weight: 28.7 }
    ],
    location: sampleLocationId,
    date: new Date('2025-01-15T10:30:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 7, weight: 31.2 },
      { materialId: "otros", count: 4, weight: 12.5 }
    ],
    location: sampleLocationId,
    date: new Date('2025-01-22T14:15:00')
  },
  
  // February 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 25, weight: 38.9 },
      { materialId: "organico", count: 18, weight: 52.4 },
      { materialId: "papel_carton", count: 9, weight: 35.6 }
    ],
    location: sampleLocationId,
    date: new Date('2025-02-10T09:45:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 14, weight: 48.7 },
      { materialId: "plasticos", count: 11, weight: 19.3 }
    ],
    location: sampleLocationId,
    date: new Date('2025-02-25T11:20:00')
  },
  
  // March 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 22, weight: 65.8 },
      { materialId: "papel_carton", count: 16, weight: 58.4 },
      { materialId: "descarte", count: 3, weight: 7.2 }
    ],
    location: sampleLocationId,
    date: new Date('2025-03-08T13:00:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 19, weight: 27.6 },
      { materialId: "papel_carton", count: 8, weight: 29.8 },
      { materialId: "otros", count: 5, weight: 15.3 }
    ],
    location: sampleLocationId,
    date: new Date('2025-03-20T10:15:00')
  },
  
  // April 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 20, weight: 72.5 },
      { materialId: "plasticos", count: 17, weight: 25.8 }
    ],
    location: sampleLocationId,
    date: new Date('2025-04-12T08:30:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 13, weight: 41.2 },
      { materialId: "papel_carton", count: 11, weight: 38.9 },
      { materialId: "plasticos", count: 9, weight: 14.5 }
    ],
    location: sampleLocationId,
    date: new Date('2025-04-28T15:45:00')
  },
  
  // May 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 28, weight: 42.3 },
      { materialId: "organico", count: 16, weight: 48.7 },
      { materialId: "papel_carton", count: 13, weight: 47.2 }
    ],
    location: sampleLocationId,
    date: new Date('2025-05-05T09:00:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 18, weight: 63.4 },
      { materialId: "otros", count: 6, weight: 18.7 },
      { materialId: "descarte", count: 4, weight: 9.8 }
    ],
    location: sampleLocationId,
    date: new Date('2025-05-18T12:30:00')
  },
  
  // June 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 24, weight: 71.5 },
      { materialId: "papel_carton", count: 15, weight: 52.8 },
      { materialId: "plasticos", count: 14, weight: 21.4 }
    ],
    location: sampleLocationId,
    date: new Date('2025-06-07T10:45:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 10, weight: 36.5 },
      { materialId: "plasticos", count: 22, weight: 33.7 }
    ],
    location: sampleLocationId,
    date: new Date('2025-06-22T14:00:00')
  },
  
  // July 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 21, weight: 31.9 },
      { materialId: "papel_carton", count: 17, weight: 61.3 },
      { materialId: "organico", count: 11, weight: 34.6 }
    ],
    location: sampleLocationId,
    date: new Date('2025-07-10T11:15:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 19, weight: 57.8 },
      { materialId: "papel_carton", count: 12, weight: 43.2 },
      { materialId: "otros", count: 7, weight: 21.4 }
    ],
    location: sampleLocationId,
    date: new Date('2025-07-25T09:30:00')
  },
  
  // August 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 23, weight: 82.6 },
      { materialId: "plasticos", count: 16, weight: 24.3 },
      { materialId: "descarte", count: 2, weight: 5.1 }
    ],
    location: sampleLocationId,
    date: new Date('2025-08-08T13:45:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 15, weight: 45.9 },
      { materialId: "plasticos", count: 13, weight: 19.8 },
      { materialId: "papel_carton", count: 9, weight: 32.7 }
    ],
    location: sampleLocationId,
    date: new Date('2025-08-20T10:00:00')
  },
  
  // September 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 26, weight: 39.4 },
      { materialId: "organico", count: 20, weight: 61.2 },
      { materialId: "papel_carton", count: 14, weight: 50.8 }
    ],
    location: sampleLocationId,
    date: new Date('2025-09-12T08:15:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "papel_carton", count: 19, weight: 68.9 },
      { materialId: "otros", count: 8, weight: 24.5 }
    ],
    location: sampleLocationId,
    date: new Date('2025-09-28T15:30:00')
  },
  
  // October 2025
  {
    classified: true,
    clientId: clientId,
    collections: [
      { materialId: "organico", count: 17, weight: 52.3 },
      { materialId: "papel_carton", count: 21, weight: 75.4 },
      { materialId: "plasticos", count: 12, weight: 18.6 }
    ],
    location: sampleLocationId,
    date: new Date('2025-10-15T11:45:00')
  },
  {
    classified: false,
    clientId: clientId,
    collections: [
      { materialId: "plasticos", count: 24, weight: 36.2 },
      { materialId: "papel_carton", count: 16, weight: 57.1 },
      { materialId: "organico", count: 14, weight: 42.8 }
    ],
    location: sampleLocationId,
    date: new Date('2025-10-29T09:00:00')
  }
];

async function add2025Collections() {
  console.log('='.repeat(80));
  console.log('ADDING 2025 COLLECTION DATA');
  console.log('='.repeat(80));
  console.log(`\nClient ID: ${clientId}`);
  console.log(`Location ID: ${sampleLocationId}`);
  console.log(`Adding ${collections2025.length} collections for year 2025\n`);
  
  try {
    let addedCount = 0;
    
    for (let i = 0; i < collections2025.length; i++) {
      const collectionData = collections2025[i];
      const collectionRef = collection(db, "collections");
      const docRef = doc(collectionRef);
      
      // Convert Date to Firestore Timestamp
      const timestamp = Timestamp.fromDate(collectionData.date);
      
      const dataToSave = {
        id: docRef.id,
        classified: collectionData.classified,
        clientId: collectionData.clientId,
        collections: collectionData.collections,
        location: collectionData.location,
        createdAt: timestamp,
        timeStamp: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(docRef, dataToSave);
      addedCount++;
      
      const dateStr = collectionData.date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const totalWeight = collectionData.collections.reduce((sum, c) => sum + c.weight, 0);
      const materialsStr = collectionData.collections.map(c => c.materialId).join(', ');
      
      console.log(`  ✓ Collection ${i + 1}/${collections2025.length}`);
      console.log(`    ID: ${docRef.id}`);
      console.log(`    Date: ${dateStr}`);
      console.log(`    Classified: ${collectionData.classified}`);
      console.log(`    Materials: ${materialsStr}`);
      console.log(`    Total Weight: ${totalWeight.toFixed(1)} kg`);
      console.log('');
    }
    
    console.log('='.repeat(80));
    console.log(`✅ Successfully added ${addedCount} collections for 2025!`);
    console.log('='.repeat(80));
    console.log('\nDate Range:');
    console.log(`  From: ${collections2025[0].date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`  To:   ${collections2025[collections2025.length - 1].date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

add2025Collections();

