// ---------------------------------------------------------------------------------------------------------------------
// Insert Tests
// ---------------------------------------------------------------------------------------------------------------------

import Knex from 'knex';

import { DB2Dialect } from '../../src/';

// Utils
import { testSql } from '../utils/testSql';

// ---------------------------------------------------------------------------------------------------------------------

const knex = Knex({
    client: DB2Dialect,
});

// ---------------------------------------------------------------------------------------------------------------------

describe('Insert Statements', () =>
{
    it('supports basic insert', () =>
    {
        const record = {
            x: 1,
            y: 2,
        };
        const query = knex.insert(record).into('testtable');

        testSql(
            query,
            'insert into "testtable" ("x", "y") values (1, 2)'
        );
    });

    it('supports insert with a returning clause', () =>
    {
        const record = {
            x: 1,
            y: 2,
        };
        const query = knex.insert(record).into('testtable').returning('id');

        testSql(
            query,
            'select "id" from FINAL TABLE(insert into "testtable" ("x", "y") values (1, 2))'
        );
    });

    it('supports insert with a returning clause and multiple columns', () =>
    {
        const record = {
            x: 1,
            y: 2,
        };
        const query = knex.insert(record).into('testtable').returning([ 'id', 'x' ]);

        testSql(
            query,
            'select "id", "x" from FINAL TABLE(insert into "testtable" ("x", "y") values (1, 2))'
        );
    });

    it('supports insert with a with clause', () =>
    {
        const record = {
            x: 1,
            y: 2,
        };
        const query = knex.with('withClause', knex.select('id').from('testtable')).insert(record).into('testtable');

        testSql(
            query,
            'with "withClause" as (select "id" from "testtable") insert into "testtable" ("x", "y") values (1, 2)'
        );
    });
});

// ---------------------------------------------------------------------------------------------------------------------
