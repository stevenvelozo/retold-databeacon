-- Chinook music store schema + seed data for DataBeacon integration testing (PostgreSQL)
-- Based on https://github.com/lerocha/chinook-database
-- Uses snake_case naming (PostgreSQL convention) vs MySQL's PascalCase

-- [ artist ]
CREATE TABLE artist (
	artist_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	name VARCHAR(120),
	CONSTRAINT artist_pkey PRIMARY KEY (artist_id)
);

-- [ album ]
CREATE TABLE album (
	album_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	title VARCHAR(160) NOT NULL,
	artist_id INT NOT NULL,
	CONSTRAINT album_pkey PRIMARY KEY (album_id)
);

-- [ genre ]
CREATE TABLE genre (
	genre_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	name VARCHAR(120),
	CONSTRAINT genre_pkey PRIMARY KEY (genre_id)
);

-- [ media_type ]
CREATE TABLE media_type (
	media_type_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	name VARCHAR(120),
	CONSTRAINT media_type_pkey PRIMARY KEY (media_type_id)
);

-- [ track ]
CREATE TABLE track (
	track_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	name VARCHAR(200) NOT NULL,
	album_id INT,
	media_type_id INT NOT NULL,
	genre_id INT,
	composer VARCHAR(220),
	milliseconds INT NOT NULL,
	bytes INT,
	unit_price NUMERIC(10,2) NOT NULL,
	CONSTRAINT track_pkey PRIMARY KEY (track_id)
);

-- [ employee ]
CREATE TABLE employee (
	employee_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	last_name VARCHAR(20) NOT NULL,
	first_name VARCHAR(20) NOT NULL,
	title VARCHAR(30),
	reports_to INT,
	birth_date TIMESTAMP,
	hire_date TIMESTAMP,
	address VARCHAR(70),
	city VARCHAR(40),
	state VARCHAR(40),
	country VARCHAR(40),
	postal_code VARCHAR(10),
	phone VARCHAR(24),
	fax VARCHAR(24),
	email VARCHAR(60),
	CONSTRAINT employee_pkey PRIMARY KEY (employee_id)
);

-- [ customer ]
CREATE TABLE customer (
	customer_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	first_name VARCHAR(40) NOT NULL,
	last_name VARCHAR(20) NOT NULL,
	company VARCHAR(80),
	address VARCHAR(70),
	city VARCHAR(40),
	state VARCHAR(40),
	country VARCHAR(40),
	postal_code VARCHAR(10),
	phone VARCHAR(24),
	fax VARCHAR(24),
	email VARCHAR(60) NOT NULL,
	support_rep_id INT,
	CONSTRAINT customer_pkey PRIMARY KEY (customer_id)
);

-- [ invoice ]
CREATE TABLE invoice (
	invoice_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	customer_id INT NOT NULL,
	invoice_date TIMESTAMP NOT NULL,
	billing_address VARCHAR(70),
	billing_city VARCHAR(40),
	billing_state VARCHAR(40),
	billing_country VARCHAR(40),
	billing_postal_code VARCHAR(10),
	total NUMERIC(10,2) NOT NULL,
	CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id)
);

-- [ invoice_line ]
CREATE TABLE invoice_line (
	invoice_line_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	invoice_id INT NOT NULL,
	track_id INT NOT NULL,
	unit_price NUMERIC(10,2) NOT NULL,
	quantity INT NOT NULL,
	CONSTRAINT invoice_line_pkey PRIMARY KEY (invoice_line_id)
);

-- [ playlist ]
CREATE TABLE playlist (
	playlist_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,
	name VARCHAR(120),
	CONSTRAINT playlist_pkey PRIMARY KEY (playlist_id)
);

-- [ playlist_track ]
CREATE TABLE playlist_track (
	playlist_id INT NOT NULL,
	track_id INT NOT NULL,
	CONSTRAINT playlist_track_pkey PRIMARY KEY (playlist_id, track_id)
);

-- Foreign Keys
ALTER TABLE album ADD CONSTRAINT album_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artist (artist_id);
ALTER TABLE track ADD CONSTRAINT track_album_id_fkey FOREIGN KEY (album_id) REFERENCES album (album_id);
ALTER TABLE track ADD CONSTRAINT track_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES genre (genre_id);
ALTER TABLE track ADD CONSTRAINT track_media_type_id_fkey FOREIGN KEY (media_type_id) REFERENCES media_type (media_type_id);
ALTER TABLE customer ADD CONSTRAINT customer_support_rep_id_fkey FOREIGN KEY (support_rep_id) REFERENCES employee (employee_id);
ALTER TABLE invoice ADD CONSTRAINT invoice_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer (customer_id);
ALTER TABLE invoice_line ADD CONSTRAINT invoice_line_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoice (invoice_id);
ALTER TABLE invoice_line ADD CONSTRAINT invoice_line_track_id_fkey FOREIGN KEY (track_id) REFERENCES track (track_id);
ALTER TABLE playlist_track ADD CONSTRAINT playlist_track_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES playlist (playlist_id);
ALTER TABLE playlist_track ADD CONSTRAINT playlist_track_track_id_fkey FOREIGN KEY (track_id) REFERENCES track (track_id);

-- Seed Data
INSERT INTO artist (name) VALUES
('AC/DC'), ('Accept'), ('Aerosmith'), ('Alanis Morissette'), ('Alice In Chains'),
('Antonio Carlos Jobim'), ('Apocalyptica'), ('Audioslave'), ('BackBeat'), ('Billy Cobham');

INSERT INTO album (title, artist_id) VALUES
('For Those About To Rock We Salute You', 1), ('Let There Be Rock', 1),
('Balls to the Wall', 2), ('Restless and Wild', 2),
('Big Ones', 3), ('Jagged Little Pill', 4),
('Facelift', 5), ('Warner 25 Anos', 6),
('Plays Metallica By Four Cellos', 7), ('Audioslave', 8);

INSERT INTO genre (name) VALUES
('Rock'), ('Jazz'), ('Metal'), ('Alternative & Punk'), ('Rock And Roll'),
('Blues'), ('Latin'), ('Reggae'), ('Pop'), ('Soundtrack');

INSERT INTO media_type (name) VALUES
('MPEG audio file'), ('Protected AAC audio file'), ('Protected MPEG-4 video file'),
('Purchased AAC audio file'), ('AAC audio file');

INSERT INTO track (name, album_id, media_type_id, genre_id, composer, milliseconds, bytes, unit_price) VALUES
('For Those About To Rock (We Salute You)', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 343719, 11170334, 0.99),
('Put The Finger On You', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 205662, 6713451, 0.99),
('Lets Get It Up', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 233926, 7636561, 0.99),
('Inject The Venom', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 210834, 6852860, 0.99),
('Snowballed', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 203102, 6599424, 0.99),
('Evil Walks', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 263497, 8611245, 0.99),
('C.O.D.', 1, 1, 1, 'Angus Young, Malcolm Young, Brian Johnson', 199836, 6566314, 0.99),
('Go Down', 2, 1, 1, 'AC/DC', 331180, 10847611, 0.99),
('Dog Eat Dog', 2, 1, 1, 'AC/DC', 215196, 7032162, 0.99),
('Let There Be Rock', 2, 1, 1, 'AC/DC', 366654, 12021261, 0.99),
('Balls to the Wall', 3, 1, 1, NULL, 342562, 5510424, 0.99),
('Fast As a Shark', 4, 1, 1, 'F. Baltes, S. Kaufman, U. Dirkschneider & W. Hoffmann', 230619, 3990994, 0.99),
('Restless and Wild', 4, 1, 1, 'F. Baltes, R.A. Smith-Diesel, S. Kaufman, U. Dirkschneider & W. Hoffmann', 252051, 4331779, 0.99),
('Walk On Water', 5, 1, 1, 'Steven Tyler, Joe Perry, Jack Blades, Tommy Shaw', 295680, 9719579, 0.99),
('Love In An Elevator', 5, 1, 1, 'Steven Tyler, Joe Perry', 321828, 10552051, 0.99);

INSERT INTO employee (last_name, first_name, title, birth_date, hire_date, address, city, state, country, postal_code, phone, email) VALUES
('Adams', 'Andrew', 'General Manager', '1962-02-18', '2002-08-14', '11120 Jasper Ave NW', 'Edmonton', 'AB', 'Canada', 'T5K 2N1', '+1 (780) 428-9482', 'andrew@chinookcorp.com'),
('Edwards', 'Nancy', 'Sales Manager', '1958-12-08', '2002-05-01', '825 8 Ave SW', 'Calgary', 'AB', 'Canada', 'T2P 2T3', '+1 (403) 262-3443', 'nancy@chinookcorp.com'),
('Peacock', 'Jane', 'Sales Support Agent', '1973-08-29', '2002-04-01', '1111 6 Ave SW', 'Calgary', 'AB', 'Canada', 'T2P 5M5', '+1 (403) 262-3443', 'jane@chinookcorp.com');

INSERT INTO customer (first_name, last_name, company, address, city, state, country, postal_code, phone, email, support_rep_id) VALUES
('Luiz', 'Goncalves', 'Embraer', 'Av. Brigadeiro Faria Lima, 2170', 'Sao Jose dos Campos', 'SP', 'Brazil', '12227-000', '+55 (12) 3923-5555', 'luiz@embraer.com.br', 3),
('Leonie', 'Kohler', NULL, 'Theodor-Heuss-Str. 34', 'Stuttgart', NULL, 'Germany', '70174', '+49 0711 2842222', 'leonekohler@surfeu.de', 3),
('Francois', 'Tremblay', NULL, '1498 rue Belanger', 'Montreal', 'QC', 'Canada', 'H2G 1A7', '+1 (514) 721-4711', 'ftremblay@gmail.com', 3);

INSERT INTO invoice (customer_id, invoice_date, billing_address, billing_city, billing_country, total) VALUES
(1, '2024-01-01', 'Av. Brigadeiro Faria Lima, 2170', 'Sao Jose dos Campos', 'Brazil', 3.98),
(2, '2024-01-02', 'Theodor-Heuss-Str. 34', 'Stuttgart', 'Germany', 1.98),
(3, '2024-01-05', '1498 rue Belanger', 'Montreal', 'Canada', 5.94);

INSERT INTO invoice_line (invoice_id, track_id, unit_price, quantity) VALUES
(1, 1, 0.99, 2), (1, 2, 0.99, 2),
(2, 3, 0.99, 2),
(3, 4, 0.99, 2), (3, 5, 0.99, 2), (3, 6, 0.99, 2);

INSERT INTO playlist (name) VALUES
('Music'), ('Movies'), ('TV Shows'), ('Audiobooks'), ('90s Music');

INSERT INTO playlist_track (playlist_id, track_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10);
