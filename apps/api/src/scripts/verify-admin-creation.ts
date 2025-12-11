import { auth } from "../lib/auth.ts";
import { db } from "../db/index.ts";
import { admin, adminRoles, adminPermissions, adminRolePermissions } from "../db/schemas/auth.ts";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting Admin Verification...");

  // 1. Verify Super Admin exists
  const superAdminEmail = "ogunbaysaltr@gmail.com";
  const superAdmin = await db.query.admin.findFirst({
    where: eq(admin.email, superAdminEmail),
  });

  if (!superAdmin) {
    console.error("❌ Super Admin not found! Seeding failed.");
    process.exit(1);
  } else {
    console.log("✅ Super Admin found:", superAdmin.email);
  }

  // 2. Verify Super Admin has Role and Permissions
  const role = await db.query.adminRoles.findFirst({
    where: eq(adminRoles.id, superAdmin.roleId || ""),
  });

  if (!role || role.name !== "Super Admin") {
    console.error("❌ Super Admin role incorrect or missing.");
    process.exit(1);
  }
  console.log("✅ Super Admin has role:", role.name);

  const permissions = await db
    .select()
    .from(adminRolePermissions)
    .leftJoin(adminPermissions, eq(adminRolePermissions.permissionId, adminPermissions.id))
    .where(eq(adminRolePermissions.roleId, role.id));
  
  const hasCreatePerm = permissions.some(p => p.admin_permissions?.slug === "create:admin");
  if (!hasCreatePerm) {
    console.error("❌ Super Admin missing 'create:admin' permission.");
    process.exit(1);
  }
  console.log("✅ Super Admin has 'create:admin' permission.");

  console.log("✅ Verification Complete! Admin system structure is correct.");
  // Note: True E2E verification of the API route requires a running server + auth tokens, 
  // which is complex to script in this environment without `supertest` or similar.
  // We verified the DB state and seed logic, which confirms schema works.
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
