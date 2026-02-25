import { initializeFirebase } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

export const addTestData = async () => {
  try {
    const { firestore: db } = initializeFirebase();
    const docRef = await addDoc(collection(db, "test"), {
      name: "Romy",
      project: "GradeX",
      createdAt: new Date()
    });

    console.log("Document ID:", docRef.id);
  } catch (error) {
    console.error("Error:", error);
  }
};