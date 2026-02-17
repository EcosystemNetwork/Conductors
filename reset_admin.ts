
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
const sql = neon(DATABASE_URL);

async function main() {
    console.log('Resetting admin_wallet setting...');
    try {
        await sql`DELETE FROM system_settings WHERE key = 'admin_wallet'`;
        console.log('Admin wallet reset.');
    } catch (err) {
        console.error('Reset failed:', err);
        process.exit(1);
    }
}

main();
