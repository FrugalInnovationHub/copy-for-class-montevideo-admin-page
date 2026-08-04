import { db } from "/firebase.js"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, limit as qLimit, } from "firebase/firestore";
import userServices from "../services/userServices";


// ======================== Client Functions ========================

/**
 * Get up to 100 clients.
 * Returns an array of plain objects exactly as stored in Firestore.
 */
export const getClients = async (setClients) => {
  try {
    const q = query(collection(db, "clients"), qLimit(100));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data());
    if (typeof setClients === "function") setClients(list);
    return list;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Get a single client by id.
 * Returns the plain object exactly as stored in Firestore.
 */
export const getClient = async (id, setClient) => {
  try {
    const ref = doc(db, "clients", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Client ${id} not found`);
    const obj = snap.data();
    if (typeof setClient === "function") setClient(obj);
    return obj;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Create/overwrite a client with a specific id.
 * Expects a plain object that already has .id (you’re controlling doc ID).
 * Writes the object as-is.
 */
export const createClient = async (client, setResponse) => {
  try {
    if (!client?.id) throw new Error("client.id is required");
    const ref = doc(db, "clients", client.id);
    await setDoc(ref, client); // write exactly what you pass
    if (typeof setResponse === "function") setResponse(ref);
    return ref;
  } catch (e) {
    console.error(e);
    throw e;
  }
};


/**
 * Delete a client by id.
 */
export const deleteClient = async (id) => {
  try {
    await deleteDoc(doc(db, "clients", id));
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};


/**
 * Edit a client by id with a partial update.
 * Sends exactly what you provide (no shaping).
 */
export const editClient = async (data, id) => {
  try {
    const ref = doc(db, "clients", id);
    await updateDoc(ref, data); // raw partial update
    return ref;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Get up to 100 users
 * Returns: Array of raw objects exactly as stored in Firestore
 */
export const getUsers = async (setUsers) => {
  try {
    const q = query(collection(db, "users"), qLimit(100));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data()); // raw only
    if (typeof setUsers === "function") setUsers(list);
    return list;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Get a single user by id
 * Returns: Raw object exactly as stored in Firestore
 */
export const getUser = async (id, setUser) => {
  try {
    const ref = doc(db, "users", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`User ${id} not found`);
    const obj = snap.data(); // raw only
    if (typeof setUser === "function") setUser(obj);
    return obj;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Create/overwrite a user with a specific id
 * Expects: data.id exists (you control doc ID)
 * Writes: exactly what you pass
 */
export const createUser = async (data, setResponse) => {
  try {
    if (!data?.id) throw new Error("user.id is required");
    const ref = doc(db, "users", data.id);
    await setDoc(ref, data); // write raw
    if (typeof setResponse === "function") setResponse(ref);
    return ref;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Edit a user by id with a partial update
 * Sends exactly what you provide (raw patch)
 */
export const editUser = async (data, id) => {
  try {
    const ref = doc(db, "users", id);
    await updateDoc(ref, data); // raw partial
    return ref;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Delete a user by id
 */
export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, "users", id));
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getClassifications = async (clientId) => {
  try {
    if (!clientId) throw new Error("clientId is required");
    const q = query(
      collection(db, "classifications"),
      where("clientId", "==", clientId)
    );
    const snap = await getDocs(q);
    // return plain objects exactly as stored in Firestore
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Fetch specific collection docs by their Firestore document IDs.
 * Returns plain objects with an added `id` (doc id) for joining.
 * Used by the report to match each classification row via `collectionId`.
 */
export const getCollectionsByIds = async (ids = []) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const snaps = await Promise.all(
      ids.map((id) => getDoc(doc(db, "collections", id)))
    );
    return snaps
      .filter((s) => s.exists())
      .map((s) => ({ id: s.id, ...s.data() }));
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Get all collections for a specific client
 * Returns: Array of collection objects with id included
 */
export const getCollectionsByClientId = async (clientId) => {
  try {
    if (!clientId) throw new Error("clientId is required");
    const q = query(
      collection(db, "collections"),
      where("clientId", "==", clientId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * Create a new collection document
 * Auto-generates document ID
 * Returns: The document reference
 */
export const createCollection = async (collectionData) => {
  try {
    if (!collectionData?.clientId) throw new Error("clientId is required");
    const collectionRef = collection(db, "collections");
    const docRef = doc(collectionRef); // auto-generate ID
    await setDoc(docRef, {
      ...collectionData,
      createdAt: new Date(),
      timeStamp: new Date()
    });
    return { id: docRef.id, ...collectionData };
  } catch (e) {
    console.error(e);
    throw e;
  }
};


// ==============================================================

// ==============================================================
// ==============================================================
// THESE CALLS ARE FROM THE OLD BACKEND THEY ARE NOT USED ANYMORE
// ==============================================================
// ==============================================================

// ==============================================================

const getPickup = async (id, setPickup) => {
  const fetchPromise = userServices.get(id, "api/pickup/");
  fetchPromise.then(response => {
    console.log(response)
    setPickup(response.data.pickup)
    return response.data
  })
    .catch((e) => {
      console.log(e);
    });
}

const getClientPickups = (id, setPickups) => {
  const fetchPromise = userServices.get(id, "api/pickup/");
  fetchPromise.then(response => {
    console.log(response)
    setPickups(response.data)
    return response.data
  })
    .catch((e) => {
      console.log(e);
    });
}

const getAllPickups = async () => {
  const result = await userServices.get('', "api/pickup/?type=classified");
  return result.data;
}

const getReportPickups = (id, setPickups) => {
  const fetchPromise = userServices.get(id, "api/pickup/");
  fetchPromise.then(response => {
    console.log(response)
    let pickupList = response.data.pickups


    console.log(pickupList)
    setPickups(pickupList)

  })
    .catch((e) => {
      console.log(e);
    });
}

const getMaterials = (setMaterials) => {
  const fetchPromise = userServices.getAll("api/categories/");
  fetchPromise.then(response => {
    console.log(response)
    setMaterials(response.data.categories)
  })
    .catch((e) => {
      console.log(e);
    });
}

const addMaterial = (data) => {
  const fetchPromise = userServices.create(data, "api/categories/");
  fetchPromise.then(response => {
    console.log(response)
    window.location.reload()
    return response.data
  })
    .catch((e) => {
      console.log(e);
    });
}

const deleteMaterial = (id) => {
  const fetchPromise = userServices.remove(id, "api/categories/");
  fetchPromise.then(response => {
    console.log(response)
    window.location.reload()
  })
    .catch((e) => {
      console.log(e);
    });
}

const editMaterial = (data, id) => {
  const fetchPromise = userServices.update(id, data, "api/categories/");
  fetchPromise.then(response => {
    console.log(response)
    window.location.reload()
  })
    .catch((e) => {
      console.log(e);
    });
}


const calls = {
  getUsers,
  getUser,
  createUser,
  getPickup,
  getClientPickups,
  getReportPickups,
  editUser,
  deleteUser,
  deleteClient,
  getMaterials,
  addMaterial,
  deleteMaterial,
  editMaterial,
  getAllPickups
}

export default calls;