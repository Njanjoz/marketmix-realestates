// scripts/migrateProperties.js
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PUBLIC_FIELDS, PROTECTED_FIELDS } from "../src/utils/propertyMapping.js";

// Initialize Firebase Admin with project configuration
const app = initializeApp({
  projectId: "housing-database-e467b",
});
const db = getFirestore(app);

async function migrate() {
  console.log("Starting migration...");
  const propertiesRef = db.collection("properties");
  const snapshot = await propertiesRef.get();
  
  let migrated = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.isProtected) {
      console.log(`Skipping already migrated property: ${doc.id}`);
      continue;
    }

    try {
      const publicData = { isProtected: true };
      const protectedData = { propertyId: doc.id, createdAt: data.createdAt, updatedAt: data.updatedAt };

      PUBLIC_FIELDS.forEach(field => {
        if (field !== 'isProtected' && data.hasOwnProperty(field)) {
          publicData[field] = data[field];
        }
      });

      PROTECTED_FIELDS.forEach(field => {
        if (data.hasOwnProperty(field)) {
          protectedData[field] = data[field];
        }
      });

      // Write protected document
      await db.collection("properties_protected").doc(doc.id).set(protectedData);
      
      // Update public document
      await propertiesRef.doc(doc.id).set(publicData);
      
      migrated++;
      console.log(`Migrated: ${doc.id}`);
    } catch (e) {
      console.error(`Failed to migrate ${doc.id}:`, e);
      failed++;
    }
  }

  console.log(`Migration finished. Migrated: ${migrated}, Failed: ${failed}`);
}

migrate();
