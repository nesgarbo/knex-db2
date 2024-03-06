# IBM DB2 Knex Dialect

This project is a fork from [knex-ibmi][] to focus on the IBM DB2 Dialect. This project is a work in progress and is 
not yet ready for production use. In theory, I haven't broken anything that worked in the previous module, however, 
since my main focus is on cleaning up the code base and getting the unit tests running again, I can't promise I didn't 
accidentally break something.

Additionally, I plan to move on from the `odbc` package to the `ibm_db` package. This will bring the project in line 
with the current recommended driver for IBM DB2 on Node.js. As this is intended to allow for use of knex with IBM DB2, 
as a replacement for using the `ibm_db` package directly, I feel it is important to use the recommended driver.

This work is currently being done as an exploratory project with my currently employer, and may be dropped at any time.

---

**Disclaimer: This library is in beta. Please submit an issue for any bugs encounter or any questions you have.**

## Description

This is an external dialect for [knex](https://github.com/tgriesser/knex). This library uses the ODBC driver and is only tested on IBMi. Here are the IBM OSS Docs https://ibmi-oss-docs.readthedocs.io/en/latest/odbc/README.html

## Supported functionality

- Query building
- Query execution (see [Limitations](#Limitations))
- Transactions

## Limitations

Currently, this dialect has limited functionality compared to the Knex built-in dialects. Below are some of the limitations:

- No streaming support
- Possibly other missing functionality
- Journaling must be handled separately. After a migration is ran journaling can be configured on the newly created tables. I recommend using the schema utility in the i access client solutions software.

## Installing

`npm install @bdkinc/knex-ibmi`

Requires Node v14 or higher.

## Dependencies

`npm install odbc` see [IBM ODBC Docs for dependencies](https://ibmi-oss-docs.readthedocs.io/en/latest/odbc/README.html) if you run into any issues

`npm install knex`

## Usage

This library is written in typescript and compiled to both commonjs and esm.

```javascript
const knex = require("knex");
const { DB2Dialect } = require("@bdkinc/knex-ibmi");

const db = knex({
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "knextest",
    port: 50000,
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
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

const query = db.select("*").from("table").where({ foo: "bar" });

query
  .then((result) => console.log(result))
  .catch((err) => console.error(err))
  .finally(() => process.exit());
```

or as ESM

```javascript
import knex from "knex";
import { DB2Dialect } from "@bdkinc/knex-ibmi";

const db = knex({
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "knextest",
    port: 50000,
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
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

try {
  const data = await db.select("*").from("table").where({ foo: "bar" });
  console.log(data);
} catch (err) {
  throw new Error(err);
} finally {
  process.exit();
}
```

or as Typescript

```typescript
import { knex } from "knex";
import { DB2Dialect, DB2Config } from "@bdkinc/knex-ibmi";

const config: DB2Config = {
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "knextest",
    port: 50000,
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
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

try {
  const data = await db.select("*").from("table").where({ foo: "bar" });
  console.log(data);
} catch (err) {
  throw new Error(err);
} finally {
  process.exit();
}
```

## Pooling

Tarn Pooling Configuration

```javascript
const db = knex({
  client: DB2Dialect,
  connection: {
    host: "localhost",
    database: "knextest",
    port: 50000,
    user: "<user>",
    password: "<password>",
    driver: "IBM i Access ODBC Driver",
    connectionStringParams: {
      ALLOWPROCCALLS: 1,
      CMT: 0,
    },
  },
  pool: {
    min: 2,
    max: 10,
    acquireConnectionTimeout: 6000,
  },
});
```

## Configuring your driver

If you don't know the name of your installed driver, then look in `odbcinst.ini`. You can find the full path of the file by running `odbcinst -j`.
There you should see an entry like the one below:

```
[IBM i Access ODBC Driver] <== driver name in square brackets
Description=IBM i Access for Linux ODBC Driver
Driver=/opt/ibm/iaccess/lib/libcwbodbc.so
Setup=/opt/ibm/iaccess/lib/libcwbodbcs.so
Driver64=/opt/ibm/iaccess/lib64/libcwbodbc.so
Setup64=/opt/ibm/iaccess/lib64/libcwbodbcs.so
Threading=0
DontDLClose=1
UsageCount=1

[IBM i Access ODBC Driver 64-bit]
Description=IBM i Access for Linux 64-bit ODBC Driver
Driver=/opt/ibm/iaccess/lib64/libcwbodbc.so
Setup=/opt/ibm/iaccess/lib64/libcwbodbcs.so
Threading=0
DontDLClose=1
UsageCount=1
```

If that still doesn't work, then unixodbc is probably looking for the config files in the wrong directory. A common case is that the configs are in `/etc` but your system expects them to be somewhere else. In such case, override the path unixodbc looks in via the `ODBCSYSINI` and `ODBCINI` environment variables.
E.g., `ODBCINI=/etc ODBCSYSINI=/etc`.


<!-- Links -->

[knex-ibmi]: https://github.com/bdkinc/knex-ibmi
