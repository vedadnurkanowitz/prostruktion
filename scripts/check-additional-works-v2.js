
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parser for .env.local
function loadEnv() {
    try {
        const content = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking project_additional_works table...');

    // Attempt to insert a dummy record to check schema/permissions
    // We'll revert in a transaction or just delete it if possible, 
    // or just checking select is safer first.

    const { data, error } = await supabase
        .from('project_additional_works')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing table:', error);
    } else {
        console.log('Table access successful. Data sample:', data);
    }
}

checkTable();
