// This seed file is intentionally empty. Run seedDatabase() from services if needed.
// For manual seeding, use prisma studio: npx prisma studio
// Or use the POST /demo/reset endpoint on the API to seed demo data.

const main = async () => {
  console.log("✨ Database schema is ready!");
  console.log("To seed demo data, run: npm run seed:demo");
};

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
