import { auth } from "../lib/auth";
import { db } from "./index";
import { user } from "./schemas";
import { eq } from "drizzle-orm";

async function main() {
  const email = "ogunbaysaltr@gmail.com";
  const password = "demo1234";
  const name = "Ogun Baysal";

  console.log(`Checking if user ${email} exists...`);

  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    console.log("User already exists. Updating role to admin...");
    await db
      .update(user)
      .set({ 
        role: "admin",
        status: "active" 
      })
      .where(eq(user.email, email));
    
    console.log("User updated successfully!");
    return;
  }

  console.log("Creating new admin user...");
  
  // Create user using Better Auth
  // We need to mock a request context or use the internal API if available without context
  // For local seeding, we can try using the internal function if exposed, but api.signUpEmail expects headers
  // Let's try to mock headers
  
  try {
    const res = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        },
        asResponse: false // Get data directly
    });

    if (res?.user) {
        console.log("User created! Promoting to admin...");
        // Update to admin
        await db
            .update(user)
            .set({ 
                role: "admin",
                status: "active" 
            })
            .where(eq(user.id, res.user.id));
            
        console.log("Admin user created successfully!");
    } else {
        console.error("Failed to create user:", res);
    }
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
