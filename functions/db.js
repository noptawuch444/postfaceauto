const admin = require('firebase-admin');

// No need to call initializeApp here if it's already called in index.js
// But for safety or stand-alone scripts, we handle it
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

const collections = {
    PAGES: 'pages',
    TEMPLATES: 'templates',
    POSTS: 'posts',
    USERS: 'users',
    SETTINGS: 'settings'
};

/**
 * Firestore Database Helper
 * Designed to mimic some SQL-like behavior for ease of porting
 */
module.exports = {
    admin,
    db,
    collections,

    // Helper: Get document by ID
    get: async (coll, id) => {
        const doc = await db.collection(coll).doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    // Helper: Query collection
    query: async (coll, constraints = []) => {
        let q = db.collection(coll);
        for (const [field, op, value] of constraints) {
            q = q.where(field, op, value);
        }
        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Helper: Create document
    add: async (coll, data) => {
        const docRef = await db.collection(coll).add({
            ...data,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    },

    // Helper: Update document
    update: async (coll, id, data) => {
        await db.collection(coll).doc(id).update({
            ...data,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
    },

    // Helper: Delete document
    delete: async (coll, id) => {
        await db.collection(coll).doc(id).delete();
    }
};
