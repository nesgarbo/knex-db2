// ---------------------------------------------------------------------------------------------------------------------
// Join Tests
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

describe('Join Statements', () =>
{
    it('supports basic join', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id"'
        );
    });

    it('supports left join', () =>
    {
        const query = knex
            .select()
            .from('test')
            .leftJoin('othertable', 'test.id', '=', 'othertable.id');

        testSql(
            query,
            'select * from "test" left join "othertable" on "test"."id" = "othertable"."id"'
        );
    });

    it('supports right join', () =>
    {
        const query = knex
            .select()
            .from('test')
            .rightJoin('othertable', 'test.id', '=', 'othertable.id');

        testSql(
            query,
            'select * from "test" right join "othertable" on "test"."id" = "othertable"."id"'
        );
    });

    it('supports full outer join', () =>
    {
        const query = knex
            .select()
            .from('test')
            .fullOuterJoin('othertable', 'test.id', '=', 'othertable.id');

        testSql(
            query,
            'select * from "test" full outer join "othertable" on "test"."id" = "othertable"."id"'
        );
    });

    it('supports joinRaw', () =>
    {
        const query = knex
            .select()
            .from('test')
            .joinRaw('natural full join othertable on test.id = othertable.id');

        testSql(
            query,
            'select * from "test" natural full join othertable on test.id = othertable.id'
        );
    });

    it('supports join with where', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .where('othertable.x', 1);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" = 1'
        );
    });

    it('supports join with whereNull', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereNull('othertable.x');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" is null'
        );
    });

    it('supports join with whereNotNull', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereNotNull('othertable.x');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" is not null'
        );
    });

    it('supports join with whereExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereExists(function ()
            {
                this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with whereNotExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereNotExists(function ()
            {
                this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where not exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with whereBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereBetween('othertable.x', [1, 10]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" between 1 and 10'
        );
    });

    it('supports join with whereNotBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereNotBetween('othertable.x', [1, 10]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" not between 1 and 10'
        );
    });

    it('supports join with whereIn', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereIn('othertable.x', [1, 2, 3]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" in (1, 2, 3)'
        );
    });

    it('supports join with whereNotIn', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereNotIn('othertable.x', [1, 2, 3]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" not in (1, 2, 3)'
        );
    });

    it('supports join with whereRaw', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .whereRaw('"othertable"."x" = 1');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" = 1'
        );
    });

    it('supports join with orWhere', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhere('othertable.x', 1);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" = 1'
        );
    });

    it('supports join with andWhere', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .andWhere('othertable.x', 1);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" = 1'
        );
    });

    it('supports join with orWhereNull', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereNull('othertable.x');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" is null'
        );
    });

    it('supports join with orWhereExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereExists(function ()
            {
                this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with orWhereNotExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereNotExists(function ()
            {
                this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where not exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with orWhereBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereBetween('othertable.x', [1, 10]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" between 1 and 10'
        );
    });

    it('supports join with andWhereBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .andWhereBetween('othertable.x', [1, 10]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" between 1 and 10'
        );
    });

    it('supports join with orWhereNotBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereNotBetween('othertable.x', [1, 10]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" not between 1 and 10'
        );
    });

    it('supports join with andWhereNotBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .andWhereNotBetween('othertable.x', [1, 10]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" not between 1 and 10'
        );
    });

    it('supports join with orWhereIn', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereIn('othertable.x', [1, 2, 3]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" in (1, 2, 3)'
        );
    });

    it('supports join with orWhereNotIn', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereNotIn('othertable.x', [1, 2, 3]);

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" not in (1, 2, 3)'
        );
    });

    it('supports join with orWhereRaw', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .orWhereRaw('"othertable"."x" = 1');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" = 1'
        );
    });

    it('supports join with andWhereRaw', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', 'test.id', '=', 'othertable.id')
            .andWhereRaw('"othertable"."x" = 1');

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" where "othertable"."x" = 1'
        );
    });

    it('supports join with orOn', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').orOn('test.x', 'othertable.x');
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" or "test"."x" = "othertable"."x"'
        );
    });

    it('supports join with andOn', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').andOn('test.x', 'othertable.x');
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" and "test"."x" = "othertable"."x"'
        );
    });

    it('supports join with orOnExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').orOnExists(function ()
                {
                    this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
                });
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" or exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with andOnExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').andOnExists(function ()
                {
                    this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
                });
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" and exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with orOnNotExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').orOnNotExists(function ()
                {
                    this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
                });
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" or not exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with andOnNotExists', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').andOnNotExists(function ()
                {
                    this.select('*').from('another').whereRaw('"othertable"."id" = "another"."id"');
                });
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" and not exists (select * from "another" where "othertable"."id" = "another"."id")'
        );
    });

    it('supports join with orOnBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').orOnBetween('othertable.x', [1, 10]);
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" or "othertable"."x" between 1 and 10'
        );
    });

    it('supports join with andOnBetween', () =>
    {
        const query = knex
            .select()
            .from('test')
            .join('othertable', function ()
            {
                this.on('test.id', 'othertable.id').andOnBetween('othertable.x', [1, 10]);
            });

        testSql(
            query,
            'select * from "test" inner join "othertable" on "test"."id" = "othertable"."id" and "othertable"."x" between 1 and 10'
        );
    });
});

// ---------------------------------------------------------------------------------------------------------------------
