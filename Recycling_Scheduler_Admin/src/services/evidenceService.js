import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, Timestamp } from "firebase/firestore";

const collectionName = "evidences";

/**
 * Uploads multiple images to Firebase Storage and saves metadata to Firestore.
 * New Schema:
 * - clientId: string
 * - locationId: string
 * - images: string[] (array of download URLs)
 * - notes: string
 * - dateTime: Timestamp (user-selected date/time)
 * - createdAt: Timestamp
 * - updatedAt: Timestamp
 */
const uploadEvidence = async (files, { clientId, locationId, notes = "" }, customDate = null) => {
    try {
        if (!clientId || !locationId) throw new Error("clientId and locationId are required");
        if (!files?.length) throw new Error("At least one image is required");

        const now = new Date();
        const dateTime = customDate ? new Date(customDate) : now;
        if (Number.isNaN(dateTime.getTime())) throw new Error("A valid evidence date is required");
        const timestamp = dateTime.getTime();

        // 1. Upload all files to Storage
        const imageUrls = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type?.startsWith("image/")) throw new Error(`${file.name} is not an image`);
            const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            const filename = `${timestamp}_${crypto.randomUUID()}_${i}.${extension}`;
            const storagePath = `evidences/${filename}`;
            const storageRef = ref(storage, storagePath);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            imageUrls.push(downloadURL);
        }

        // 2. Save to Firestore
        const docData = {
            clientId,
            locationId,
            images: imageUrls,
            notes: notes || "",
            dateTime: Timestamp.fromDate(dateTime),
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
        };

        const docRef = await addDoc(collection(db, collectionName), docData);

        return { id: docRef.id, ...docData };
    } catch (error) {
        console.error("Error uploading evidence:", error);
        throw error;
    }
};

/**
 * Retrieves evidence entries, ordered by dateTime descending.
 */
const getEvidence = async (lastDoc = null) => {
    try {
        let q = query(
            collection(db, collectionName),
            orderBy("dateTime", "desc"),
            limit(25)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                id: doc.id,
                ...docData,
                // Convert Timestamps to JS Dates for easier use in UI
                dateTime: docData.dateTime?.toDate?.() || null,
                createdAt: docData.createdAt?.toDate?.() || null,
                updatedAt: docData.updatedAt?.toDate?.() || null,
                doc: doc // For pagination
            };
        });
        console.log("Fetched evidence data:", data.map(d => ({ id: d.id, images: d.images })));
        return data;
    } catch (error) {
        console.error("Error fetching evidence:", error);
        throw error;
    }
};

const evidenceService = {
    uploadEvidence,
    getEvidence
};

export default evidenceService;
