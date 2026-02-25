import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findDuplicateEmails() {
    const studentsRef = collection(db, "students");
    const snapshot = await getDocs(studentsRef);

    const emails: Record<string, string[]> = {};

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
            if (!emails[data.email]) {
                emails[data.email] = [];
            }
            emails[data.email].push(doc.id);
        }
    });

    console.log("Duplicate Report:");
    let found = false;
    for (const [email, ids] of Object.entries(emails)) {
        if (ids.length > 1) {
            found = true;
            console.log(`Email: ${email} is found in documents: ${ids.join(', ')}`);
        }
    }

    if (!found) {
        console.log("No duplicate emails found in Firestore!");
    } else {
        // Show all documents that don't look like Auth UIDs (which are 28 chars long)
        console.log("\nGhost Documents (Likely Roll Numbers):");
        snapshot.docs.forEach(doc => {
            if (doc.id.length < 20) {
                console.log(`- ${doc.id} (${doc.data().email})`);
            }
        });
    }
}

findDuplicateEmails().catch(console.error);
