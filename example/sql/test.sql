-----------------------------------------------------------------------------------------------------------------------
-- Set up some Test Tables for Local Testing
-----------------------------------------------------------------------------------------------------------------------

CREATE SCHEMA test;

CREATE TABLE test.testtable (
    id INT NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    x INT NOT NULL,
    Y INT NOT NULL
);

CREATE TABLE test.othertable (
    id INT NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description VARCHAR(100) NOT NULL,
    shown BOOLEAN NOT NULL
);


-- Insert some data into the tables
INSERT INTO test.testtable (x, y) VALUES (1, 2);
INSERT INTO test.testtable (x, y) VALUES (3, 4);
INSERT INTO test.testtable (x, y) VALUES (5, 6);
INSERT INTO test.testtable (x, y) VALUES (7, 8);

INSERT INTO test.othertable (description, shown) VALUES ('First', TRUE);
INSERT INTO test.othertable (description, shown) VALUES ('Second', FALSE);
INSERT INTO test.othertable (description, shown) VALUES ('Third', TRUE);
INSERT INTO test.othertable (description, shown) VALUES ('Fourth', FALSE);

-- Test Queries
SELECT * FROM test.testtable;
SELECT * FROM test.othertable;

SELECT * FROM test.testtable as t
JOIN test.othertable as o ON t.id = o.id;

-----------------------------------------------------------------------------------------------------------------------
