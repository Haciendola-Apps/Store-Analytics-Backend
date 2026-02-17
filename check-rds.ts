
import { DataSource } from 'typeorm';

async function checkRDS() {
    const ds = new DataSource({
        type: 'postgres',
        host: 'haciendola-dev.cg4tirjrqxtm.us-east-2.rds.amazonaws.com',
        port: 5432,
        username: 'haciendola_dev',
        password: 'mWZh0illAdDngoL55cpw',
        database: 'store_analytics'
    });

    try {
        console.log('Connecting to RDS...');
        await ds.initialize();
        console.log('Connected!');

        const tables = await ds.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables in public schema:');
        console.table(tables);

        for (const t of tables) {
            const count = await ds.query(`SELECT COUNT(*) FROM "${t.table_name}"`);
            console.log(`Table ${t.table_name}: ${count[0].count} records`);
        }

        await ds.destroy();
    } catch (error) {
        console.error('RDS Connection Failed:', error);
    }
}

checkRDS();
