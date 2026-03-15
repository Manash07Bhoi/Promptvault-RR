import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createSuperAdmin() {
  const email = "alberteinstein9485@gmail.com";
  const password = "Roshan#8800$21";

  const hash = await bcrypt.hash(password, 12);

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(usersTable)
      .set({
        passwordHash: hash,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        displayName: "Super Admin",
      })
      .where(eq(usersTable.email, email));
    console.log(`Updated super admin: ${email}`);
  } else {
    await db.insert(usersTable).values({
      email,
      passwordHash: hash,
      displayName: "Super Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    });
    console.log(`Created super admin: ${email}`);
  }

  console.log(`\nSuper Admin Credentials:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  URL:      /pvx-admin (double-click logo to open)`);

  process.exit(0);
}

createSuperAdmin().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
