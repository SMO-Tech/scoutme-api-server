
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';



const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Separate connection pool for SMO_V1 database
const smoV1ConnectionString = process.env.SMO_V1_DATABASE_URL;
export const smoV1Pool = smoV1ConnectionString ? new Pool({ connectionString: smoV1ConnectionString }) : null;