//----------------------------------------------------------------------------------------------------------------------

import Transaction from 'knex/lib/execution/transaction';
import { Database } from 'ibm_db';

//----------------------------------------------------------------------------------------------------------------------

// The Knex.Transaction interface doesn't correctly implement the `begin`, `rollback`, or `commit` methods. This class
// Has to use a type definition that sucks, because Knex's typing sucks. Sorry.

class DB2Transaction extends Transaction
{
    begin(connection : Database) : any
    {
        return connection.beginTransaction();
    }

    rollback(connection : Database) : any
    {
        return connection.rollbackTransaction();
    }

    commit(connection : Database) : any
    {
        return connection.commitTransaction();
    }
}

//----------------------------------------------------------------------------------------------------------------------

export default DB2Transaction;

//----------------------------------------------------------------------------------------------------------------------
