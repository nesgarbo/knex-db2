// ---------------------------------------------------------------------------------------------------------------------
// Identifier Wrapping Tests
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

describe('Identifiers', () =>
{
    it('does not wrap identifiers by default', () =>
    {
        const query = knex.select([ 'x', 'y' ]).from('test')
            .where('x', 1);

        testSql(query, 'select x, y from test where x = 1');
    });

    it('supports wrapping identifiers', () =>
    {
        const query = knex.select([ '"x"', '"y"' ]).from('"test"')
            .where('"x"', 1);

        testSql(query, 'select "x", "y" from "test" where "x" = 1');
    });
});

// ---------------------------------------------------------------------------------------------------------------------
