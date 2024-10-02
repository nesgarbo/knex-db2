//----------------------------------------------------------------------------------------------------------------------
// IBM DB2 Knex Dialect
//----------------------------------------------------------------------------------------------------------------------

import * as process from 'process';
import { Knex, knex } from 'knex';
import ibmdb, { Database } from 'ibm_db';

// Internal Classes
import SchemaCompiler from './schema/db2-compiler';
import TableCompiler from './schema/db2-table-compiler';
import ColumnCompiler from './schema/db2-column-compiler';
import Transaction from './execution/db2-transaction';
import QueryCompiler from './query/db2-query-compiler';

// Utils
import { hasOwn } from './utils/objects';

//----------------------------------------------------------------------------------------------------------------------

interface DB2ConnectionParams
{
    CMT ?: number;
    CONNTYPE ?: number;
    DBQ ?: string;
    MAXDECPREC ?: 31 | 63;
    MAXDECSCALE ?: number;
    MINDIVSCALE ?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    NAM ?: 0 | 1;
    DFT ?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    DSP ?: 0 | 1 | 2 | 3 | 4;
    DEC ?: 0 | 1;
    DECFLOATERROROPTION ?: 0 | 1;
    DECFLOATROUNDMODE ?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    MAPDECIMALFLOATDESCRIBE ?: 1 | 3;
    ALLOWPROCCALLS ?: 0 | 1;
}

interface DB2ConnectionConfig
{
    database : string;
    host : string;
    port : number;
    user : string;
    password : string;
    connectionStringParams ?: DB2ConnectionParams;
}

export interface DB2Config
{
    client : any;
    connection : DB2ConnectionConfig;
    pool ?: Knex.PoolConfig;
}

//----------------------------------------------------------------------------------------------------------------------

class DB2Client extends knex.Client
{
    constructor(config : Knex.Config<DB2Config>)
    {
        super(config);
        this.driverName = 'ibm_db';

        if(this.dialect && !this.config.client)
        {
            this.printWarn(
                `Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the `
                + `future. Please use configuration option 'client' instead.`
            );
        }

        const dbClient = this.config.client || this.dialect;
        if(!dbClient)
        {
            throw new Error(
                `knex: Required configuration option 'client' is missing.`
            );
        }

        if(config.version)
        {
            this.version = config.version;
        }

        if(this.driverName && config.connection)
        {
            this.initializeDriver();
            if(!config.pool || (config.pool && config.pool.max !== 0))
            {
                this.initializePool(config);
            }
        }
        this.valueForUndefined = this.raw('DEFAULT');
        if(config.useNullAsDefault)
        {
            this.valueForUndefined = null;
        }
    }

    _driver() : any
    {
        return ibmdb;
    }

    wrapIdentifierImpl(value : string) : string
    {
        return value;
    }

    printDebug(message : string) : void
    {
        if(process.env.DEBUG === 'true')
        {
            this.logger.debug?.(`knex-db2: ${ message }`);
        }
    }

    printError(message : string) : void
    {
        if(process.env.DEBUG === 'true')
        {
            this.logger.error?.(`knex-db2: ${ message }`);
        }
    }

    printWarn(message : string) : void
    {
        if(process.env.DEBUG === 'true')
        {
            this.logger.warn?.(`knex-db2: ${ message }`);
        }
    }

    // Get a raw connection, called by the pool manager whenever a new
    // connection needs to be added to the pool.
    async acquireRawConnection() : Promise<Database>
    {
        this.printDebug('acquiring raw connection');
        const connectionConfig = this.config.connection;
        const connStr = this._getConnectionString(connectionConfig);

        this.printDebug(connStr);
        return this.driver.open(connStr);
    }

    // Used to explicitly close a connection, called internally by the pool manager
    // when a connection times out or the pool is shutdown.
    async destroyRawConnection(connection : Database) : Promise<void>
    {
        this.printDebug('destroy connection');
        await connection.close();
    }

    _getConnectionString(connectionConfig) : string
    {
        const connectionStringParams = connectionConfig.connectionStringParams || {};
        const connectionStringExtension = Object.keys(connectionStringParams)
            .reduce((result, key) =>
            {
                const value = connectionStringParams[key];
                return `${ result }${ key }=${ value };`;
            }, '');

        return `DRIVER=${ connectionConfig.driver };`
            + `SYSTEM=${ connectionConfig.host };`
            + `HOSTNAME=${ connectionConfig.host };`
            + `PORT=${ connectionConfig.port };`
            + `DATABASE=${ connectionConfig.database };`
            + `UID=${ connectionConfig.user };`
            + `PWD=${ connectionConfig.password };`
            + `${ connectionStringExtension }`;
    }

    // Runs the query on the specified connection, providing the bindings
    // and any other necessary prep work.
    async _query(connection : any, obj : any) : Promise<any>
    {
        if(!obj || typeof obj == 'string')
        {
            obj = { sql: obj };
        }
        const method = (hasOwn(obj, 'method') && obj.method !== 'raw' ? obj.method : obj.sql.split(' ')[0])
            .toLowerCase();

        obj.sqlMethod = method;

        // Different functions are used since query() doesn't return # of rows affected,
        // which is needed for queries that modify the database

        if(method === 'select' || method === 'first' || method === 'pluck')
        {
            const rows : any = await connection.query(obj.sql, obj.bindings);
            if(rows)
            {
                obj.response = { rows, rowCount: rows.length };
            }
        }
        else
        {
            try
            {
                const statement = await connection.prepare(obj.sql);
                if(obj.returning)
                {
                    const resultObj = await statement.execute(obj.bindings);
                    const result = await resultObj.fetchAll();
                    obj.response = { rows: result, rowCount: result.length };
                    await resultObj.close();
                }
                else
                {
                    const result = await statement.executeNonQuery(obj.bindings);
                    obj.response = { rowCount: result };
                }
                await statement.close();
            }
            catch (err : any)
            {
                this.printError(err);
                throw new Error(err);
            }
        }

        this.printDebug(obj.sql + obj.bindings ? JSON.stringify(obj.bindings) : '');
        return obj;
    }

    transaction(container : any, config : any, outerTx : any) : Knex.Transaction
    {
        return new Transaction(this, container, config, outerTx);
    }

    schemaCompiler(tableBuilder : any) : SchemaCompiler
    {
        return new SchemaCompiler(this, tableBuilder);
    }

    tableCompiler(tableBuilder : any) : TableCompiler
    {
        return new TableCompiler(this, tableBuilder);
    }

    columnCompiler(tableCompiler : any, columnCompiler : any) : ColumnCompiler
    {
        return new ColumnCompiler(this, tableCompiler, columnCompiler);
    }

    queryCompiler(builder : Knex.QueryBuilder) : QueryCompiler
    {
        return new QueryCompiler(this, builder);
    }

    processResponse(obj : any, runner : any) : any
    {
        if(obj === null)
        {
            return null;
        }

        const { response: resp, sqlMethod: method, returning } = obj;
        const { rows, rowCount } = resp;

        if(obj.output)
        {
            return obj.output.call(runner, resp);
        }

        switch (method)
        {
            case 'select':
                return rows;
            case 'pluck':
                return rows.map(obj.pluck);
            case 'first':
                return rows[0];
            case 'insert':
            case 'del':
            case 'delete':
            case 'update':
                if(returning)
                {
                    return rows;
                }
                return rowCount;
            case 'counter':
                return rowCount;
            default:
                return rows;
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------

export const DB2Dialect = DB2Client;
export default DB2Client;

//----------------------------------------------------------------------------------------------------------------------
