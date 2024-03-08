**⚠️ Disclaimer ⚠️: This library should be considered 'beta' quality. This work is currently being done as an
exploratory project with my currently employer, and may be dropped at any time.**

# IBM DB2 Knex Dialect

This project is a fork from [knex-ibmi][] to focus on the IBM DB2 Dialect. This project is a work in progress and is 
**not yet ready for production use**. In theory, I haven't broken anything that worked in the previous project, 
however, 
since my main focus is on cleaning up the code base and getting the unit tests running again, I can't promise I didn't 
accidentally break something.

The largest change is the removal of the [odbc][] library in favor of [ibm_db][].

## Description

This is an external dialect for [knex][]. This library uses the official IBM DB2 driver for Node.js, [ibm_db][].

## Supported functionality

- Query building
- Query execution (see [Limitations](#Limitations))
- Transactions

## Limitations

Currently, this dialect has limited functionality compared to the Knex built-in dialects. Below are some of the 
limitations:

- No streaming support
- Possibly other missing functionality

## Installing

`npm install @morgul/knex-db2`

Requires Node v16 or higher. Tested on v18 and v20.

### Apple Silicon

The official IBM driver doesn't support Apple Silicon, so you will need to use Rosetta 2 to run this library on an 
M1/M2/M3 Mac. They provide some context [here][m1]. After setting up homebrew as they suggest, you can simply launch a 
shell in x86_64 mode:

```shell
arch -x86_64 /bin/zsh
```

Then you can install the library as normal. (You will need to run your application in x86_64 mode as well.)

## Dependencies

`npm install knex`

## Usage

This library is written in typescript and compiled to both commonjs and esm:

```javascript

// Require is supported
const knex = require('knex');
const { DB2Dialect } = require('@morgul/knex-db2');

// Or as ESM
import knex from 'knex';
import { DB2Dialect } from '@morgul/knex-db2';

const db = knex({
  client: DB2Dialect,
  connection: {
    host: 'localhost',
    database: 'knextest',
    port: 50000,
    user: '<user>',
    password: '<password>',
    connectionStringParams: {
      ALLOWPROCCALLS: 1,
      CMT: 0,
    },
  },
  pool: {
    min: 2,
    max: 10,
  },
});

const query = db.select('*').from('table').where({ foo: 'bar' });

query
  .then((result) => console.log(result))
  .catch((err) => console.error(err))
  .finally(() => process.exit());
```

or as Typescript

```typescript
import { knex } from 'knex';
import { DB2Dialect, DB2Config } from '@morgul/knex-db2';

const config: DB2Config = {
  client: DB2Dialect,
  connection: {
    host: 'localhost',
    database: 'knextest',
    port: 50000,
    user: '<user>',
    password: '<password>',
    connectionStringParams: {
      ALLOWPROCCALLS: 1,
      CMT: 0,
    },
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const db = knex(config);
const query = db.select('*').from('table').where({ foo: 'bar' });

query
    .then((result) => console.log(result))
    .catch((err) => console.error(err))
    .finally(() => process.exit());
```

<!-- Links -->

[knex]: https://github.com/tgriesser/knex
[knex-ibmi]: https://github.com/bdkinc/knex-ibmi
[ibm_db]: https://github.com/ibmdb/node-ibm_db
[odbc]: https://github.com/markdirish/node-odbc

[m1]: https://github.com/ibmdb/node-ibm_db/blob/master/INSTALL.md#m1chip
