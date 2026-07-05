import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─────────────────────────────────────────────
  // 1. Categories
  // ─────────────────────────────────────────────
  console.log("📂 Seeding categories...");

  const categoriesData = [
    {
      name: "Plumbing",
      nameUz: "Santexnik",
      icon: "🔧",
      slug: "plumbing",
    },
    {
      name: "Electrical",
      nameUz: "Elektrik",
      icon: "⚡",
      slug: "electrical",
    },
    {
      name: "Carpentry",
      nameUz: "Duradgor",
      icon: "🪚",
      slug: "carpentry",
    },
    {
      name: "Painting",
      nameUz: "Bo'yoqchi",
      icon: "🎨",
      slug: "painting",
    },
    {
      name: "AC Repair",
      nameUz: "Konditsioner ta'miri",
      icon: "❄️",
      slug: "ac-repair",
    },
    {
      name: "Appliance Repair",
      nameUz: "Maishiy texnika ta'miri",
      icon: "🔌",
      slug: "appliance-repair",
    },
    {
      name: "Cleaning",
      nameUz: "Tozalash",
      icon: "🧹",
      slug: "cleaning",
    },
    {
      name: "Moving",
      nameUz: "Ko'chib o'tish",
      icon: "📦",
      slug: "moving",
    },
    {
      name: "Welding",
      nameUz: "Payvandlash",
      icon: "🔥",
      slug: "welding",
    },
    {
      name: "Locksmith",
      nameUz: "Qulf ustasi",
      icon: "🔑",
      slug: "locksmith",
    },
  ];

  const categories: Record<string, Awaited<ReturnType<typeof prisma.category.upsert>>> = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        nameUz: cat.nameUz,
        icon: cat.icon,
      },
      create: cat,
    });
    categories[cat.slug] = created;
    console.log(`  ✓ Category: ${cat.nameUz} (${cat.name})`);
  }

  // ─────────────────────────────────────────────
  // 2. Masters
  // ─────────────────────────────────────────────
  console.log("👷 Seeding masters...");

  const baseMastersData = [
    {
      email: "alisher.karimov@example.uz",
      fullName: "Alisher Karimov",
      phone: "+998901234567",
      bio: "10 yillik tajribaga ega santexnik. Toshkent bo'ylab xizmat ko'rsataman. Kafolat bilan ishlayman.",
      serviceArea: "Toshkent",
      isVerified: true,
      isActive: true,
      rating: 4.8,
      reviewCount: 47,
      categorySlugs: ["plumbing", "welding"],
    },
    {
      email: "bobur.toshmatov@example.uz",
      fullName: "Bobur Toshmatov",
      phone: "+998901234568",
      bio: "Sertifikatlangan elektrik mutaxassisi. Uy va ofis elektr tizimlarini o'rnatish va ta'mirlash.",
      serviceArea: "Toshkent",
      isVerified: true,
      isActive: true,
      rating: 4.6,
      reviewCount: 32,
      categorySlugs: ["electrical"],
    },
    {
      email: "sardor.yusupov@example.uz",
      fullName: "Sardor Yusupov",
      phone: "+998901234569",
      bio: "Professional duradgor va mebel ustasi. Har qanday yog'och ishlarini sifatli bajaraman.",
      serviceArea: "Toshkent",
      isVerified: true,
      isActive: true,
      rating: 4.9,
      reviewCount: 61,
      categorySlugs: ["carpentry"],
    },
    {
      email: "jasur.nazarov@example.uz",
      fullName: "Jasur Nazarov",
      phone: "+998901234570",
      bio: "Konditsioner o'rnatish va ta'mirlash bo'yicha mutaxassis. Barcha markalar bilan ishlash tajribasi bor.",
      serviceArea: "Toshkent",
      isVerified: false,
      isActive: true,
      rating: 4.3,
      reviewCount: 18,
      categorySlugs: ["ac-repair", "appliance-repair"],
    },
    {
      email: "mirzo.rahimov@example.uz",
      fullName: "Mirzo Rahimov",
      phone: "+998901234571",
      bio: "Uy va ofislarni bo'yash va ta'mirlash xizmatlari. Sifatli materiallar va professional yondashuv.",
      serviceArea: "Toshkent",
      isVerified: true,
      isActive: true,
      rating: 4.7,
      reviewCount: 29,
      categorySlugs: ["painting", "cleaning"],
    },
  ];

  // Generate additional demo masters to reach ~30 total
  const demoNames = [
    "Azizbek Qodirov",
    "Shoxrux Ergashev",
    "Farrux Jo'rayev",
    "Sanjar Ismoilov",
    "Otabek Rustamov",
    "Javohir Mamadaliyev",
    "Bekzod To'xtayev",
    "Anvar Iskandarov",
    "Ulug'bek Matkarimov",
    "Ibrohim Usmonov",
    "Komiljon Qurbonov",
    "Zokirjon Alimuhamedov",
    "Sherzod G'aniev",
    "Nodir Abdug'afforov",
    "Shuhrat Xasanov",
    "Suhrob Tursunov",
    "Diyorbek Ortiqov",
    "Jamshid Abdullayev",
    "Samandar Murodov",
    "Temurbek Norbo'tayev",
    "Abror Yuldashev",
    "Asadbek Sattorov",
    "Dilshod Jalolov",
    "Mirjalol Rajabov",
    "Rustam Ochilov",
  ];

  const areaPool = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona"];
  const categoryPool = Object.keys(categories);

  const generatedMasters = demoNames.map((fullName, i) => {
    const slugA = categoryPool[i % categoryPool.length];
    const slugB = categoryPool[(i + 3) % categoryPool.length];
    const phone = `+99890${String(1234572 + i).padStart(7, "0")}`;
    const rating = Number((4.1 + ((i % 9) * 0.1)).toFixed(1));
    const reviewCount = 8 + (i * 3);
    const area = areaPool[i % areaPool.length];

    return {
      email: `demo.master${i + 1}@example.uz`,
      fullName,
      phone,
      bio: `${area} bo'yicha tezkor xizmat. Tajriba: ${3 + (i % 8)} yil. Narxlar: 80,000 — 350,000 so'm`,
      serviceArea: area,
      isVerified: i % 3 !== 0,
      isActive: true,
      rating,
      reviewCount,
      categorySlugs: slugA === slugB ? [slugA] : [slugA, slugB],
    };
  });

  // Guaranteed demo: at least one dedicated master for every category
  const perCategoryMasters = categoriesData.map((cat, i) => {
    const area = areaPool[i % areaPool.length];
    const phone = `+99893${String(5000000 + i).padStart(7, "0")}`;

    return {
      email: `demo.${cat.slug}@example.uz`,
      fullName: `${cat.nameUz} Ustasi`,
      phone,
      bio: `${cat.nameUz} bo'yicha maxsus demo usta. ${area} hududida xizmat ko'rsatadi. Narxlar: 100,000 — 400,000 so'm`,
      serviceArea: area,
      isVerified: true,
      isActive: true,
      rating: Number((4.5 + (i % 3) * 0.1).toFixed(1)),
      reviewCount: 12 + i,
      categorySlugs: [cat.slug],
    };
  });

  const mastersData = [...baseMastersData, ...generatedMasters, ...perCategoryMasters];

  const masters: Record<string, Awaited<ReturnType<typeof prisma.master.upsert>>> = {};

  for (const masterData of mastersData) {
    const { categorySlugs, ...data } = masterData;
    const hashedPassword = await bcrypt.hash("master123", 12);

    const master = await prisma.master.upsert({
      where: { email: data.email },
      update: {
        fullName: data.fullName,
        phone: data.phone,
        bio: data.bio,
        serviceArea: data.serviceArea,
        isVerified: data.isVerified,
        isActive: data.isActive,
        rating: data.rating,
        reviewCount: data.reviewCount,
      },
      create: {
        ...data,
        password: hashedPassword,
      },
    });

    // Assign categories
    for (const slug of categorySlugs) {
      const category = categories[slug];
      if (category) {
        await prisma.masterCategory.upsert({
          where: {
            masterId_categoryId: {
              masterId: master.id,
              categoryId: category.id,
            },
          },
          update: {},
          create: {
            masterId: master.id,
            categoryId: category.id,
          },
        });
      }
    }

    masters[data.email] = master;
    console.log(`  ✓ Master: ${data.fullName}`);
  }

  // ─────────────────────────────────────────────
  // 3. Admin User
  // ─────────────────────────────────────────────
  console.log("🔐 Seeding admin user...");

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@ustatanla.uz";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD env o'rnatilishi shart (kamida 8 belgi). Default parol bilan admin yaratilmaydi."
    );
  }
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: "UstaTanla Admin",
      password: hashedAdminPassword,
    },
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
      name: "UstaTanla Admin",
    },
  });
  console.log(`  ✓ Admin: ${adminEmail}`);

  // ─────────────────────────────────────────────
  // 4. Sample Service Requests
  // ─────────────────────────────────────────────
  console.log("📋 Seeding service requests...");

  const requestsData = [
    {
      customerName: "Dilnoza Azimova",
      customerPhone: "+998977654321",
      title: "Hammomda quvur oqmoqda",
      description:
        "Vannaxona ostidagi quvurdan suv oqib chiqmoqda. Tezda ta'mirlash kerak. Biroz jiddiy muammo — pol namlanyapti.",
      categorySlug: "plumbing",
      urgency: "HIGH",
      status: "PENDING",
      address: "Yunusobod tumani, 19-kvartal",
      city: "Toshkent",
      latitude: 41.3373,
      longitude: 69.3455,
    },
    {
      customerName: "Kamol Ergashev",
      customerPhone: "+998977654322",
      title: "Yashash xonasiga konditsioner o'rnatish",
      description:
        "18 kvadrat metrlik xonaga yangi konditsioner o'rnatish kerak. Qurilma sotib olingan, faqat o'rnatuvchi kerak.",
      categorySlug: "ac-repair",
      urgency: "MEDIUM",
      status: "MATCHED",
      address: "Chilonzor tumani, 14-kvartal",
      city: "Toshkent",
      latitude: 41.2995,
      longitude: 69.2401,
    },
    {
      customerName: "Zulfiya Hasanova",
      customerPhone: "+998977654323",
      title: "Oshxona shkaflarini ta'mirlash",
      description:
        "Oshxona shkaflarining eshiklari singan va petlalari buzilgan. 3 ta shkaf eshigini ta'mirlash yoki almashtirish kerak.",
      categorySlug: "carpentry",
      urgency: "LOW",
      status: "COMPLETED",
      address: "Mirzo Ulug'bek tumani, Qorasaroy ko'chasi",
      city: "Toshkent",
      latitude: 41.3221,
      longitude: 69.3012,
    },
  ];

  for (const reqData of requestsData) {
    const { categorySlug, ...data } = reqData;
    const category = categories[categorySlug];

    if (!category) {
      console.warn(`  ⚠ Category not found for slug: ${categorySlug}`);
      continue;
    }

    // Use upsert-like logic via findFirst + create to avoid duplicate titles
    const existing = await prisma.serviceRequest.findFirst({
      where: { title: data.title, customerPhone: data.customerPhone },
    });

    let assignedMasterId: string | undefined;
    if (data.status !== "PENDING") {
      const masterForCategory = await prisma.masterCategory.findFirst({
        where: { categoryId: category.id },
        select: { masterId: true },
      });
      assignedMasterId = masterForCategory?.masterId;
    }

    let request;
    if (existing) {
      request = await prisma.serviceRequest.update({
        where: { id: existing.id },
        data: {
          ...data,
          urgency: data.urgency as any,
          status: data.status as any,
          categoryId: category.id,
          masterId: assignedMasterId ?? null,
        },
      });
    } else {
      request = await prisma.serviceRequest.create({
        data: {
          ...data,
          urgency: data.urgency as any,
          status: data.status as any,
          categoryId: category.id,
          masterId: assignedMasterId,
        },
      });
    }

    console.log(`  ✓ Request: "${data.title}" [${data.status}]`);

    // Add a review for the completed request
    if (data.status === "COMPLETED") {
      const sardor = masters["sardor.yusupov@example.uz"];
      if (sardor) {
        const existingReview = await prisma.review.findFirst({
          where: { requestId: request.id },
        });
        if (!existingReview) {
          await prisma.review.create({
            data: {
              requestId: request.id,
              masterId: sardor.id,
              rating: 5,
              comment:
                "Juda yaxshi usta! Ishni tez va sifatli bajardi. Narxi ham maqbul. Tavsiya qilaman.",
            },
          });
          console.log(`    ✓ Review added for "${data.title}"`);
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.category.count(),
    prisma.master.count(),
    prisma.adminUser.count(),
    prisma.serviceRequest.count(),
    prisma.review.count(),
  ]);

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Categories:       ${counts[0]}`);
  console.log(`   Masters:          ${counts[1]}`);
  console.log(`   Admin users:      ${counts[2]}`);
  console.log(`   Service requests: ${counts[3]}`);
  console.log(`   Reviews:          ${counts[4]}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
