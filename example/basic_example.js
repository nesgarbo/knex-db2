// ---------------------------------------------------------------------------------------------------------------------
// Example of Basic DB2 Usage
// ---------------------------------------------------------------------------------------------------------------------

// import knex from 'knex';
// import { DB2Dialect } from '../dist';

const knex = require('knex');
const { DB2Dialect } = require('../dist');

// ---------------------------------------------------------------------------------------------------------------------

const db = knex({
    client: DB2Dialect,
    connection: {
        host: 'localhost',
        database: 'testdb',
        port: 50000,
        user: 'db2inst1',
        password: 'password',
    },
});

// ---------------------------------------------------------------------------------------------------------------------

async function main()
{
    const results = await db
        .select()
        .from('test.testtable')
        .join('test.othertable', '"TEST"."TESTTABLE"."ID"', 'test.othertable.id');

    console.log('Join Test:', results);

    const insertResults = await db
        .insert({ x: 100, y: 200 })
        .into('test.testtable');

    console.log('Insert Test:', insertResults);

    const retResults = await db
        .insert({ x: 100, y: 200 })
        .into('test.testtable')
        .returning('id');

    console.log('Insert Returning Test:', retResults);
}

// ---------------------------------------------------------------------------------------------------------------------

main()
    .then(() => process.exit(0))
    .catch((error) =>
    {
        console.error(error);
        process.exit(1);
    });

// ---------------------------------------------------------------------------------------------------------------------
