import { NextResponse } from "next/server";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FABRIC_CATALOGS } from "@/data/fabric-catalogs";
import { useAuth } from "@/contexts/AuthContext";

export async function POST() {
  try {
    // TODO: Add proper authentication check
    // For now, use a placeholder user ID
    const userId = "system-seed";

    console.log("Number of catalogs to seed:", FABRIC_CATALOGS.length);

    let createdCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (const catalog of FABRIC_CATALOGS) {
      try {
        console.log(`Creating catalog: ${catalog.code} - ${catalog.name}`);
        
        // Check if catalog already exists
        const catalogRef = doc(db, "fabricCatalogs", catalog.code);
        const catalogDoc = await getDoc(catalogRef);
        
        if (catalogDoc.exists()) {
          console.log(`Catalog ${catalog.code} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        await setDoc(catalogRef, {
          code: catalog.code,
          name: catalog.name,
          category: catalog.category,
          colors: catalog.colors,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        createdCount++;
        console.log(`Successfully created catalog: ${catalog.code}`);
      } catch (error: any) {
        console.error(`Error creating catalog ${catalog.code}:`, error);
        errors.push({ code: catalog.code, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      skipped: skippedCount,
      errors,
      message: `Seeded ${createdCount} catalogs, skipped ${skippedCount} existing catalogs`,
    });
  } catch (error) {
    console.error("Error seeding fabric catalogs:", error);
    return NextResponse.json(
      { error: "Failed to seed fabric catalogs", details: error },
      { status: 500 }
    );
  }
}
