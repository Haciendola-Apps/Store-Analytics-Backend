const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'store_analytics',
    user: 'postgres',
    password: 'password123',
});

async function checkConversionRates() {
    try {
        await client.connect();

        const result = await client.query(`
            SELECT date, "conversionRate", "totalOrders", sessions 
            FROM daily_metric 
            WHERE date BETWEEN '2026-01-01' AND '2026-01-10' 
            ORDER BY date ASC
        `);

        console.log('\n=== Conversion Rates in Database ===');
        console.log('Date\t\tConversion Rate\tOrders\tSessions');
        console.log('---------------------------------------------------');

        let sum = 0;
        result.rows.forEach(row => {
            const cr = parseFloat(row.conversionRate);
            sum += cr;
            console.log(`${row.date}\t${cr.toFixed(6)}\t${row.totalOrders}\t${row.sessions}`);
        });

        const avg = sum / result.rows.length;
        console.log('---------------------------------------------------');
        console.log(`Average CR (decimal): ${avg.toFixed(6)}`);
        console.log(`Average CR (percent): ${(avg * 100).toFixed(2)}%`);
        console.log(`\nShopify shows: 0.8%`);
        console.log(`App shows: 0.90%`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkConversionRates();
