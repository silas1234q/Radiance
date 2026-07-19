import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const products = [
  { name: 'Gentle Foam Cleanser', brand: 'Radiance', category: 'Cleanser', description: 'pH-balanced gel cleanser for all skin types', ingredients: ['Water', 'Glycerin', 'Cocamidopropyl Betaine'] },
  { name: 'Hydrating Toner', brand: 'Radiance', category: 'Toner', description: 'Alcohol-free toner with hyaluronic acid', ingredients: ['Water', 'Hyaluronic Acid', 'Panthenol'] },
  { name: 'Vitamin C Brightening Serum', brand: 'Radiance', category: 'Serum', description: '15% Vitamin C for radiant skin', ingredients: ['Ascorbic Acid', 'Vitamin E', 'Ferulic Acid'] },
  { name: 'Niacinamide 10% Serum', brand: 'Radiance', category: 'Serum', description: 'Minimizes pores and balances oil', ingredients: ['Niacinamide', 'Zinc PCA', 'Hyaluronic Acid'] },
  { name: 'Hyaluronic Acid Serum', brand: 'Radiance', category: 'Serum', description: 'Multi-weight HA for deep hydration', ingredients: ['Hyaluronic Acid', 'Sodium Hyaluronate', 'Panthenol'] },
  { name: 'Daily Moisturizer SPF 30', brand: 'Radiance', category: 'Moisturizer', description: 'Lightweight moisturizer with sun protection', ingredients: ['Zinc Oxide', 'Niacinamide', 'Squalane'] },
  { name: 'Rich Night Cream', brand: 'Radiance', category: 'Moisturizer', description: 'Overnight repair with peptides', ingredients: ['Peptides', 'Ceramides', 'Shea Butter'] },
  { name: 'Retinol 0.5% Night Serum', brand: 'Radiance', category: 'Treatment', description: 'Gentle retinol for anti-aging', ingredients: ['Retinol', 'Squalane', 'Vitamin E'] },
  { name: 'BHA Exfoliating Liquid', brand: 'Radiance', category: 'Exfoliant', description: '2% salicylic acid for clear pores', ingredients: ['Salicylic Acid', 'Green Tea Extract', 'Methylpropanediol'] },
  { name: 'Mineral Sunscreen SPF 50', brand: 'Radiance', category: 'Sunscreen', description: 'Broad spectrum mineral protection', ingredients: ['Zinc Oxide', 'Titanium Dioxide', 'Niacinamide'] },
  { name: 'Gentle Oil Cleanser', brand: 'Radiance', category: 'Cleanser', description: 'Dissolves makeup and sunscreen', ingredients: ['Jojoba Oil', 'Squalane', 'Vitamin E'] },
  { name: 'Peptide Eye Cream', brand: 'Radiance', category: 'Eye Care', description: 'Targets dark circles and puffiness', ingredients: ['Caffeine', 'Peptides', 'Vitamin K'] },
];

async function main() {
  console.log('Seeding products...');
  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
