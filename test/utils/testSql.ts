//----------------------------------------------------------------------------------------------------------------------
// Test the sql query against the expected sql and bindings
//----------------------------------------------------------------------------------------------------------------------

import { expect } from 'chai';

//----------------------------------------------------------------------------------------------------------------------

export function testSql(query : any, expectedSql : string, expectedBindings ?: any[]) : void
{
    expect(query.toString()).to.equal(expectedSql);

    if(expectedBindings)
    {
        expect(query.toSQL().sql.bindings).to.deep.equal(expectedBindings);
    }
}

//----------------------------------------------------------------------------------------------------------------------
