// src/index.ts
import * as process from "process";
import { knex } from "knex";
import * as odbc from "odbc";
import * as console2 from "console";

// src/schema/ibmi-compiler.ts
import SchemaCompiler from "knex/lib/schema/compiler";
var IBMiSchemaCompiler = class extends SchemaCompiler {
  hasTable(tableName) {
    const formattedTable = this.client.parameter(
      // @ts-ignore
      prefixedTableName(this.schema, tableName),
      // @ts-ignore
      this.builder,
      // @ts-ignore
      this.bindingsHolder
    );
    const bindings = [tableName];
    let sql = `SELECT TABLE_NAME FROM QSYS2.SYSTABLES where TYPE = 'T' and TABLE_NAME = ${formattedTable}`;
    if (this.schema) {
      sql += " and TABLE_SCHEMA = ?";
      bindings.push(this.schema);
    }
    this.pushQuery({
      sql,
      bindings,
      output: (resp) => {
        return resp.rowCount > 0;
      }
    });
  }
  toSQL() {
    const sequence = this.builder._sequence;
    for (let i = 0, l = sequence.length; i < l; i++) {
      const query = sequence[i];
      this[query.method].apply(this, query.args);
    }
    return this.sequence;
  }
};
function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}
var ibmi_compiler_default = IBMiSchemaCompiler;

// src/schema/ibmi-tablecompiler.ts
import TableCompiler from "knex/lib/schema/tablecompiler";
import isObject from "lodash/isObject";
var IBMiTableCompiler = class extends TableCompiler {
  createQuery(columns, ifNot, like) {
    let createStatement = ifNot ? `if object_id('${this.tableName()}', 'U') is null ` : "";
    if (like) {
      createStatement += `SELECT * INTO ${this.tableName()} FROM ${this.tableNameLike()} WHERE 0=1`;
    } else {
      createStatement += "CREATE TABLE " + // @ts-ignore
      this.tableName() + // @ts-ignore
      (this._formatting ? " (\n    " : " (") + // @ts-ignore
      columns.sql.join(this._formatting ? ",\n    " : ", ") + // @ts-ignore
      this._addChecks() + ")";
    }
    this.pushQuery(createStatement);
    if (this.single.comment) {
      this.comment(this.single.comment);
    }
    if (like) {
      this.addColumns(columns, this.addColumnsPrefix);
    }
  }
  dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand("unique", this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  }
  unique(columns, indexName) {
    let deferrable;
    let predicate;
    if (isObject(indexName)) {
      ({ indexName, deferrable, predicate } = indexName);
    }
    if (deferrable && deferrable !== "not deferrable") {
      this.client.logger.warn(
        `IBMi: unique index \`${indexName}\` will not be deferrable ${deferrable}.`
      );
    }
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand("unique", this.tableNameRaw, columns);
    columns = this.formatter.columnize(columns);
    const predicateQuery = predicate ? " " + this.client.queryCompiler(predicate).where() : "";
    this.pushQuery(
      // @ts-ignore
      `create unique index ${indexName} on ${this.tableName()} (${columns})${predicateQuery}`
    );
  }
  // All of the columns to "add" for the query
  addColumns(columns, prefix) {
    prefix = prefix || this.addColumnsPrefix;
    if (columns.sql.length > 0) {
      const columnSql = columns.sql.map((column) => {
        return prefix + column;
      });
      this.pushQuery({
        sql: (
          // @ts-ignore
          (this.lowerCase ? "alter table " : "ALTER TABLE ") + // @ts-ignore
          this.tableName() + " " + columnSql.join(" ")
        ),
        bindings: columns.bindings
      });
    }
  }
  async commit(conn) {
    return await conn.commit();
  }
};
var ibmi_tablecompiler_default = IBMiTableCompiler;

// src/schema/ibmi-columncompiler.ts
import ColumnCompiler from "knex/lib/schema/columncompiler";
var IBMiColumnCompiler = class extends ColumnCompiler {
  increments(options = { primaryKey: true }) {
    return "int not null generated always as identity (start with 1, increment by 1)" + // @ts-ignore
    (this.tableCompiler._canBeAddPrimaryKey(options) ? " primary key" : "");
  }
};
var ibmi_columncompiler_default = IBMiColumnCompiler;

// src/execution/ibmi-transaction.ts
import Transaction from "knex/lib/execution/transaction";
var IBMiTransaction = class extends Transaction {
  async begin(connection) {
    await connection.beginTransaction();
    return connection;
  }
  async rollback(connection) {
    await connection.rollback();
    return connection;
  }
  async commit(connection) {
    await connection.commit();
    return connection;
  }
};
var ibmi_transaction_default = IBMiTransaction;

// src/query/ibmi-querycompiler.ts
import QueryCompiler from "knex/lib/query/querycompiler";
import isObject2 from "lodash/isObject";
import { rawOrFn as rawOrFn_ } from "knex/lib/formatter/wrappingFormatter";
import { format } from "date-fns";
import isEmpty from "lodash/isEmpty";
import * as console from "console";
var IBMiQueryCompiler = class extends QueryCompiler {
  insert() {
    const insertValues = this.single.insert || [];
    let sql = `SELECT ${// @ts-ignore
    this.single.returning ? (
      // @ts-ignore
      this.formatter.columnize(this.single.returning)
    ) : "IDENTITY_VAL_LOCAL()"} FROM FINAL TABLE(`;
    sql += this.with() + `insert into ${this.tableName} `;
    const { returning } = this.single;
    const returningSql = returning ? (
      // @ts-ignore
      this._returning("insert", returning) + " "
    ) : "";
    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return "";
      }
    } else if (typeof insertValues === "object" && isEmpty(insertValues)) {
      return {
        // @ts-ignore
        sql: sql + returningSql + this._emptyInsertValue,
        returning
      };
    }
    sql += this._buildInsertData(insertValues, returningSql);
    sql += ")";
    return {
      sql,
      returning
    };
  }
  _buildInsertData(insertValues, returningSql) {
    let sql = "";
    const insertData = this._prepInsert(insertValues);
    if (typeof insertData === "string") {
      sql += insertData;
    } else {
      if (insertData.columns.length) {
        sql += `(${this.formatter.columnize(insertData.columns)}`;
        sql += `) ${returningSql}values (` + // @ts-ignore
        this._buildInsertValues(insertData) + ")";
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue;
      } else {
        return "";
      }
    }
    return sql;
  }
  _prepInsert(data) {
    if (isObject2(data)) {
      if (data.hasOwnProperty("migration_time")) {
        const parsed = new Date(data.migration_time);
        data.migration_time = format(parsed, "yyyy-MM-dd HH:mm:ss");
      }
    }
    const isRaw = rawOrFn_(
      data,
      void 0,
      // @ts-ignore
      this.builder,
      // @ts-ignore
      this.client,
      // @ts-ignore
      this.bindingsHolder
    );
    if (isRaw)
      return isRaw;
    let columns = [];
    const values = [];
    if (!Array.isArray(data))
      data = data ? [data] : [];
    let i = -1;
    while (++i < data.length) {
      if (data[i] == null)
        break;
      if (i === 0)
        columns = Object.keys(data[i]).sort();
      const row = new Array(columns.length);
      const keys = Object.keys(data[i]);
      let j = -1;
      while (++j < keys.length) {
        const key = keys[j];
        let idx = columns.indexOf(key);
        if (idx === -1) {
          columns = columns.concat(key).sort();
          idx = columns.indexOf(key);
          let k = -1;
          while (++k < values.length) {
            values[k].splice(idx, 0, void 0);
          }
          row.splice(idx, 0, void 0);
        }
        row[idx] = data[i][key];
      }
      values.push(row);
    }
    return {
      columns,
      values
    };
  }
  update() {
    const withSQL = this.with();
    const updates = this._prepUpdate(this.single.update);
    const where = this.where();
    const order = this.order();
    const limit = this.limit();
    const { returning } = this.single;
    const values = Object.values(this.single.update).map((a) => `${a}`).join(", ");
    console.log({
      returning,
      // @ts-ignore
      where,
      // @ts-ignore
      updates,
      // @ts-ignore
      single: this.single.update,
      // @ts-ignore
      grouped: this.grouped.where,
      values
    });
    const moreWheres = (
      // @ts-ignore
      this.grouped.where && this.grouped.where.length > 0 ? (
        // @ts-ignore
        this.grouped.where.map((w) => {
          if (this.single.update.hasOwnProperty(w.column))
            return;
          if (!w.value)
            return;
          return `"${w.column}" ${w.not ? "!" : ""}${w.operator} ${w.value}`;
        })
      ) : []
    );
    let selectReturning = returning ? `select ${returning.map((a) => `"${a}"`).join(", ")} from ${// @ts-ignore
    this.tableName} where ${Object.entries(this.single.update).map(([key, value]) => `"${key}" = '${value}'`).join(" and ")}${moreWheres.length > 0 && " and "}${moreWheres.join(
      " and "
    )}` : "";
    console.log({ selectReturning });
    const sql = withSQL + // @ts-ignore
    `update ${this.single.only ? "only " : ""}${this.tableName} set ` + // @ts-ignore
    updates.join(", ") + (where ? ` ${where}` : "") + (order ? ` ${order}` : "") + (limit ? ` ${limit}` : "");
    return { sql, returning, selectReturning };
  }
  _returning(method, value, withTrigger) {
    console.log("_returning", value);
    switch (method) {
      case "update":
      case "insert":
        return value ? (
          // @ts-ignore
          `${withTrigger ? " into #out" : ""}`
        ) : "";
      case "del":
        return value ? (
          // @ts-ignore
          `${withTrigger ? " into #out" : ""}`
        ) : "";
      case "rowcount":
        return value ? "select @@rowcount" : "";
    }
  }
  columnizeWithPrefix(prefix, target) {
    const columns = typeof target === "string" ? [target] : target;
    let str = "", i = -1;
    while (++i < columns.length) {
      if (i > 0)
        str += ", ";
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  }
};
var ibmi_querycompiler_default = IBMiQueryCompiler;

// src/index.ts
var DB2Client = class extends knex.Client {
  constructor(config) {
    super(config);
    this.driverName = "odbc";
    if (this.dialect && !this.config.client) {
      this.logger.warn(
        `Using 'this.dialect' to identify the client is deprecated and support for it will be removed in the future. Please use configuration option 'client' instead.`
      );
    }
    const dbClient = this.config.client || this.dialect;
    if (!dbClient) {
      throw new Error(
        `knex: Required configuration option 'client' is missing.`
      );
    }
    if (config.version) {
      this.version = config.version;
    }
    if (this.driverName && config.connection) {
      this.initializeDriver();
      if (!config.pool || config.pool && config.pool.max !== 0) {
        this.initializePool(config);
      }
    }
    this.valueForUndefined = this.raw("DEFAULT");
    if (config.useNullAsDefault) {
      this.valueForUndefined = null;
    }
  }
  _driver() {
    return odbc;
  }
  printDebug(message) {
    if (process.env.DEBUG === "true") {
      this.logger.debug(message);
    }
  }
  // Get a raw connection, called by the pool manager whenever a new
  // connection needs to be added to the pool.
  async acquireRawConnection() {
    this.printDebug("acquiring raw connection");
    const connectionConfig = this.config.connection;
    console2.log(this._getConnectionString(connectionConfig));
    if (this.config?.connection?.pool) {
      const poolConfig = {
        connectionString: this._getConnectionString(connectionConfig),
        connectionTimeout: (
          // @ts-ignore
          this.config?.connection?.acquireConnectionTimeout || 6e4
        ),
        // @ts-ignore
        initialSize: this.config?.connection?.pool?.min || 2,
        // @ts-ignore
        maxSize: this.config?.connection?.pool?.max || 10,
        reuseConnection: true
      };
      const pool = await this.driver.pool(poolConfig);
      return await pool.connect();
    }
    return await this.driver.connect(
      this._getConnectionString(connectionConfig)
    );
  }
  // Used to explicitly close a connection, called internally by the pool manager
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    console2.log("destroy connection");
    return await connection.close();
  }
  _getConnectionString(connectionConfig) {
    const connectionStringParams = connectionConfig.connectionStringParams || {};
    const connectionStringExtension = Object.keys(
      connectionStringParams
    ).reduce((result, key) => {
      const value = connectionStringParams[key];
      return `${result}${key}=${value};`;
    }, "");
    return `${`DRIVER=${connectionConfig.driver};SYSTEM=${connectionConfig.host};HOSTNAME=${connectionConfig.host};PORT=${connectionConfig.port};DATABASE=${connectionConfig.database};UID=${connectionConfig.user};PWD=${connectionConfig.password};`}${connectionStringExtension}`;
  }
  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  async _query(connection, obj) {
    if (!obj || typeof obj == "string")
      obj = { sql: obj };
    const method = (obj.hasOwnProperty("method") && obj.method !== "raw" ? obj.method : obj.sql.split(" ")[0]).toLowerCase();
    obj.sqlMethod = method;
    if (method === "select" || method === "first" || method === "pluck") {
      const rows = await connection.query(obj.sql, obj.bindings);
      if (rows) {
        obj.response = { rows, rowCount: rows.length };
      }
    } else {
      await connection.beginTransaction();
      console2.log("transaction begun");
      try {
        const statement = await connection.createStatement();
        await statement.prepare(obj.sql);
        if (obj.bindings) {
          await statement.bind(obj.bindings);
        }
        const result = await statement.execute();
        if (result.statement.includes("IDENTITY_VAL_LOCAL()")) {
          obj.response = {
            rows: result.map(
              (row) => result.columns && result.columns?.length > 0 ? row[result.columns[0].name] : row
            ),
            rowCount: result.count
          };
        } else if (method === "update") {
          if (obj.selectReturning) {
            const returningSelect = await connection.query(obj.selectReturning);
            obj.response = {
              rows: returningSelect,
              rowCount: result.count
            };
          } else {
            obj.response = {
              rows: result,
              rowCount: result.count
            };
          }
        } else {
          obj.response = { rows: result, rowCount: result.count };
        }
      } catch (err) {
        console2.error(err);
        await connection.rollback();
        throw new Error(err);
      } finally {
        console2.log("transaction committed");
        await connection.commit();
      }
    }
    console2.log({ obj });
    return obj;
  }
  transaction(container, config, outerTx) {
    return new ibmi_transaction_default(this, ...arguments);
  }
  schemaCompiler() {
    return new ibmi_compiler_default(this, ...arguments);
  }
  tableCompiler() {
    return new ibmi_tablecompiler_default(this, ...arguments);
  }
  columnCompiler() {
    return new ibmi_columncompiler_default(this, ...arguments);
  }
  queryCompiler() {
    return new ibmi_querycompiler_default(this, ...arguments);
  }
  processResponse(obj, runner) {
    if (obj === null)
      return null;
    const resp = obj.response;
    const method = obj.sqlMethod;
    const { rows, rowCount } = resp;
    if (obj.output)
      return obj.output.call(runner, resp);
    switch (method) {
      case "select":
        return rows;
      case "pluck":
        return rows.map(obj.pluck);
      case "first":
        return rows[0];
      case "insert":
        return rows;
      case "del":
      case "delete":
      case "update":
        if (obj.selectReturning) {
          return rows;
        }
        return rowCount;
      case "counter":
        return rowCount;
      default:
        return rows;
    }
  }
};
var DB2Dialect = DB2Client;
var src_default = DB2Client;
export {
  DB2Dialect,
  src_default as default
};
