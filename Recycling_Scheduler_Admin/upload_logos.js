import XMLHttpRequest from 'xhr2';
global.XMLHttpRequest = XMLHttpRequest;

import { db, storage } from './firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

const LOGO_MAPPING = {
  '3e0040d7-2497-4327-90aa-aec7a09b1f28': {
    name: 'WTC',
    fileName: 'wtc-logo.png'
  },
  '6162c5b9-9e84-4bdf-9045-f82c8b50b86b': {
    name: 'Colegio San Ignacio',
    fileName: 'colegio-san-ignacio-logo.png'
  },
  'a71be043-6d28-4404-a681-9ab044166f9e': {
    name: 'Banco Itaú',
    fileName: 'banco-itau-logo.png'
  }
};

async function uploadLogos() {
  console.log('='.repeat(80));
  console.log('UPLOADING LOGOS TO FIREBASE STORAGE & UPDATING FIRESTORE');
  console.log('='.repeat(80));

  try {
    for (const [clientId, info] of Object.entries(LOGO_MAPPING)) {
      const localPath = path.join('public', info.fileName);
      
      if (!fs.existsSync(localPath)) {
        console.error(`❌ Local file not found: ${localPath}`);
        continue;
      }

      console.log(`\nReading ${info.fileName} for ${info.name}...`);
      const fileBuffer = fs.readFileSync(localPath);

      // Create a storage reference in firebase storage under "logos" folder
      const storagePath = `logos/${info.fileName}`;
      const storageRef = ref(storage, storagePath);

      console.log(`Uploading to Firebase Storage: ${storagePath}...`);
      const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: 'image/png'
      });
      console.log(`✓ Upload successful!`);

      console.log(`Getting download URL...`);
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✓ URL: ${downloadURL}`);

      console.log(`Updating client document in Firestore...`);
      const clientDocRef = doc(db, 'clients', clientId);
      await updateDoc(clientDocRef, {
        logo_file: downloadURL
      });
      console.log(`✓ Firestore updated successfully!`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 ALL LOGOS UPLOADED AND FIRESTORE UPDATED!');
    console.log('='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

uploadLogos();
