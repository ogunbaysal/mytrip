import { auth } from "../lib/auth.ts";
import { db } from "./index.ts";
import { admin, adminRoles, adminPermissions, adminRolePermissions } from "./schemas/auth.ts"; // Explicit import from auth schema file
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function main() {
  const email = "ogunbaysaltr@gmail.com";
  const password = "demo1234";
  const name = "Ogun Baysal";

  console.log("Seeding Admin RBAC...");

  // 1. Create Permissions
  const permissions = [
    { slug: "manage:all", description: "Full access to everything" },
    { slug: "create:admin", description: "Can create other admins" },
    { slug: "read:admin", description: "Can view admins" },
  ];

  for (const perm of permissions) {
    await db
      .insert(adminPermissions)
      .values({
        id: nanoid(),
        slug: perm.slug,
        description: perm.description,
      })
      .onConflictDoNothing({ target: adminPermissions.slug });
  }

  // 2. Create Super Admin Role
  let superAdminRole = await db.query.adminRoles.findFirst({
    where: eq(adminRoles.name, "Super Admin"),
  });

  if (!superAdminRole) {
    console.log("Creating Super Admin role...");
    const [newRole] = await db
      .insert(adminRoles)
      .values({
        id: nanoid(),
        name: "Super Admin",
        description: "Full system access",
      })
      .returning();
    superAdminRole = newRole;
  }

  // 3. Assign Permissions to Role
  const allPermissions = await db.select().from(adminPermissions);
  
  if (superAdminRole && allPermissions.length > 0) {
    for (const perm of allPermissions) {
      await db
        .insert(adminRolePermissions)
        .values({
          roleId: superAdminRole.id,
          permissionId: perm.id,
        })
        .onConflictDoNothing();
    }
  }

  console.log(`Checking if admin user ${email} exists...`);

  const existingUser = await db
    .select()
    .from(admin)
    .where(eq(admin.email, email))
    .limit(1);

  if (existingUser.length > 0 && superAdminRole) {
    console.log("User already exists. Updating role to Super Admin...");
    await db
      .update(admin)
      .set({ 
        roleId: superAdminRole.id,
        status: "active" 
      })
      .where(eq(admin.email, email));
    
    console.log("User updated successfully!");
    return;
  }

  console.log("Creating new admin user...");
  
  try {
    const res = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        },
        asResponse: false
    });

    if (res?.user && superAdminRole) {
        console.log("User created! Promoting to Super Admin...");
        // Update to admin role just in case signUp didn't catch it (though we passed it)
        await db
            .update(admin)
            .set({ 
                roleId: superAdminRole.id,
                status: "active" 
            })
            .where(eq(admin.id, res.user.id));
            
        console.log("Admin user created successfully!");
    } else {
        console.error("Failed to create user or role missing:", res);
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
