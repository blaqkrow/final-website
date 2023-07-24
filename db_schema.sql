
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

--create your tables with SQL commands here (watch out for slight syntactical differences with SQLite)

CREATE TABLE IF NOT EXISTS testUsers (
    test_user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_name TEXT NOT NULL,
    test_if_author BOOLEAN DEFAULT 0,
    test_created DATE
);

CREATE TABLE IF NOT EXISTS testUserRecords (
    test_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_record_content TEXT NOT NULL,
    test_record_title TEXT NOT NULL, 
    test_record_subtitle TEXT,
    test_record_date DATE,
    test_user_id INT, --the user that the record belongs to
    FOREIGN KEY (test_user_id) REFERENCES testUsers(test_user_id)
);

--insert default data (if necessary here)

INSERT INTO testUsers ("test_name") VALUES ("Simon Star");
INSERT INTO testUserRecords ("test_record_content", "test_user_id", "test_record_date", "test_record_title") VALUES( "This is my first article", 1, "7/23/2023", "Test");; --try changing the test_user_id to a different number and you will get an error

COMMIT;

