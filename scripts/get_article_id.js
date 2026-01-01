const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
});

async function main() {
    try {
        const res = await pool.query('SELECT id, title FROM articles LIMIT 1');
        if (res.rows.length > 0) {
            console.log('ARTICLE_ID:', res.rows[0].id);
            console.log('ARTICLE_TITLE:', res.rows[0].title);
        } else {
            console.log('NO_ARTICLES_FOUND');
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

main();
