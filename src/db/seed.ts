import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { services } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

const defaultServices = [
  {
    name: "Manicure Clasico",
    description: "Limpieza, lima, cuticulado y esmaltado regular.",
    durationMinutes: 45,
    price: 25,
    category: "manicure",
  },
  {
    name: "Manicure Gel",
    description: "Manicure completo con esmaltado en gel de larga duracion.",
    durationMinutes: 60,
    price: 35,
    category: "manicure",
  },
  {
    name: "Polygel Full Set",
    description: "Extension completa de unas con polygel, forma y diseno a elegir.",
    durationMinutes: 90,
    price: 55,
    category: "manicure",
  },
  {
    name: "Refuerzo Polygel",
    description: "Relleno y mantenimiento de polygel existente.",
    durationMinutes: 60,
    price: 40,
    category: "manicure",
  },
  {
    name: "Nail Art",
    description: "Disenos creativos y personalizados (precio adicional al servicio base).",
    durationMinutes: 30,
    price: 15,
    category: "extras",
  },
  {
    name: "Pedicure Clasico",
    description: "Tratamiento completo para pies con exfoliacion y esmaltado.",
    durationMinutes: 60,
    price: 35,
    category: "pedicure",
  },
  {
    name: "Pedicure Gel",
    description: "Pedicure completo con esmaltado en gel duradero.",
    durationMinutes: 75,
    price: 45,
    category: "pedicure",
  },
];

async function seed() {
  console.log("Seeding database...");
  await db.insert(services).values(defaultServices);
  console.log(`Inserted ${defaultServices.length} services.`);
  console.log("Done!");
}

seed().catch(console.error);
