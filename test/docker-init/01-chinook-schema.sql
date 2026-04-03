-- Chinook music store schema + seed data for DataBeacon integration testing
-- Based on https://github.com/lerocha/chinook-database

CREATE DATABASE IF NOT EXISTS chinook;
USE chinook;

-- [ Artist ]
CREATE TABLE IF NOT EXISTS `Artist` (
	`ArtistId` INT NOT NULL AUTO_INCREMENT,
	`Name` NVARCHAR(120),
	CONSTRAINT `PK_Artist` PRIMARY KEY (`ArtistId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Album ]
CREATE TABLE IF NOT EXISTS `Album` (
	`AlbumId` INT NOT NULL AUTO_INCREMENT,
	`Title` NVARCHAR(160) NOT NULL,
	`ArtistId` INT NOT NULL,
	CONSTRAINT `PK_Album` PRIMARY KEY (`AlbumId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Genre ]
CREATE TABLE IF NOT EXISTS `Genre` (
	`GenreId` INT NOT NULL AUTO_INCREMENT,
	`Name` NVARCHAR(120),
	CONSTRAINT `PK_Genre` PRIMARY KEY (`GenreId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ MediaType ]
CREATE TABLE IF NOT EXISTS `MediaType` (
	`MediaTypeId` INT NOT NULL AUTO_INCREMENT,
	`Name` NVARCHAR(120),
	CONSTRAINT `PK_MediaType` PRIMARY KEY (`MediaTypeId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Track ]
CREATE TABLE IF NOT EXISTS `Track` (
	`TrackId` INT NOT NULL AUTO_INCREMENT,
	`Name` NVARCHAR(200) NOT NULL,
	`AlbumId` INT,
	`MediaTypeId` INT NOT NULL,
	`GenreId` INT,
	`Composer` NVARCHAR(220),
	`Milliseconds` INT NOT NULL,
	`Bytes` INT,
	`UnitPrice` NUMERIC(10,2) NOT NULL,
	CONSTRAINT `PK_Track` PRIMARY KEY (`TrackId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Employee ]
CREATE TABLE IF NOT EXISTS `Employee` (
	`EmployeeId` INT NOT NULL AUTO_INCREMENT,
	`LastName` NVARCHAR(20) NOT NULL,
	`FirstName` NVARCHAR(20) NOT NULL,
	`Title` NVARCHAR(30),
	`ReportsTo` INT,
	`BirthDate` DATETIME,
	`HireDate` DATETIME,
	`Address` NVARCHAR(70),
	`City` NVARCHAR(40),
	`State` NVARCHAR(40),
	`Country` NVARCHAR(40),
	`PostalCode` NVARCHAR(10),
	`Phone` NVARCHAR(24),
	`Fax` NVARCHAR(24),
	`Email` NVARCHAR(60),
	CONSTRAINT `PK_Employee` PRIMARY KEY (`EmployeeId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Customer ]
CREATE TABLE IF NOT EXISTS `Customer` (
	`CustomerId` INT NOT NULL AUTO_INCREMENT,
	`FirstName` NVARCHAR(40) NOT NULL,
	`LastName` NVARCHAR(20) NOT NULL,
	`Company` NVARCHAR(80),
	`Address` NVARCHAR(70),
	`City` NVARCHAR(40),
	`State` NVARCHAR(40),
	`Country` NVARCHAR(40),
	`PostalCode` NVARCHAR(10),
	`Phone` NVARCHAR(24),
	`Fax` NVARCHAR(24),
	`Email` NVARCHAR(60) NOT NULL,
	`SupportRepId` INT,
	CONSTRAINT `PK_Customer` PRIMARY KEY (`CustomerId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Invoice ]
CREATE TABLE IF NOT EXISTS `Invoice` (
	`InvoiceId` INT NOT NULL AUTO_INCREMENT,
	`CustomerId` INT NOT NULL,
	`InvoiceDate` DATETIME NOT NULL,
	`BillingAddress` NVARCHAR(70),
	`BillingCity` NVARCHAR(40),
	`BillingState` NVARCHAR(40),
	`BillingCountry` NVARCHAR(40),
	`BillingPostalCode` NVARCHAR(10),
	`Total` NUMERIC(10,2) NOT NULL,
	CONSTRAINT `PK_Invoice` PRIMARY KEY (`InvoiceId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ InvoiceLine ]
CREATE TABLE IF NOT EXISTS `InvoiceLine` (
	`InvoiceLineId` INT NOT NULL AUTO_INCREMENT,
	`InvoiceId` INT NOT NULL,
	`TrackId` INT NOT NULL,
	`UnitPrice` NUMERIC(10,2) NOT NULL,
	`Quantity` INT NOT NULL,
	CONSTRAINT `PK_InvoiceLine` PRIMARY KEY (`InvoiceLineId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ Playlist ]
CREATE TABLE IF NOT EXISTS `Playlist` (
	`PlaylistId` INT NOT NULL AUTO_INCREMENT,
	`Name` NVARCHAR(120),
	CONSTRAINT `PK_Playlist` PRIMARY KEY (`PlaylistId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [ PlaylistTrack ]
CREATE TABLE IF NOT EXISTS `PlaylistTrack` (
	`PlaylistId` INT NOT NULL,
	`TrackId` INT NOT NULL,
	CONSTRAINT `PK_PlaylistTrack` PRIMARY KEY (`PlaylistId`, `TrackId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign Keys
ALTER TABLE `Album` ADD CONSTRAINT `FK_AlbumArtistId` FOREIGN KEY (`ArtistId`) REFERENCES `Artist` (`ArtistId`);
ALTER TABLE `Track` ADD CONSTRAINT `FK_TrackAlbumId` FOREIGN KEY (`AlbumId`) REFERENCES `Album` (`AlbumId`);
ALTER TABLE `Track` ADD CONSTRAINT `FK_TrackGenreId` FOREIGN KEY (`GenreId`) REFERENCES `Genre` (`GenreId`);
ALTER TABLE `Track` ADD CONSTRAINT `FK_TrackMediaTypeId` FOREIGN KEY (`MediaTypeId`) REFERENCES `MediaType` (`MediaTypeId`);
ALTER TABLE `Customer` ADD CONSTRAINT `FK_CustomerSupportRepId` FOREIGN KEY (`SupportRepId`) REFERENCES `Employee` (`EmployeeId`);
ALTER TABLE `Invoice` ADD CONSTRAINT `FK_InvoiceCustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `Customer` (`CustomerId`);
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `FK_InvoiceLineInvoiceId` FOREIGN KEY (`InvoiceId`) REFERENCES `Invoice` (`InvoiceId`);
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `FK_InvoiceLineTrackId` FOREIGN KEY (`TrackId`) REFERENCES `Track` (`TrackId`);
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `FK_PlaylistTrackPlaylistId` FOREIGN KEY (`PlaylistId`) REFERENCES `Playlist` (`PlaylistId`);
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `FK_PlaylistTrackTrackId` FOREIGN KEY (`TrackId`) REFERENCES `Track` (`TrackId`);

-- ═══════════════════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════════════════

INSERT INTO `Artist` (`Name`) VALUES
('AC/DC'), ('Accept'), ('Aerosmith'), ('Alanis Morissette'), ('Alice In Chains'),
('Antonio Carlos Jobim'), ('Apocalyptica'), ('Audioslave'), ('BackBeat'), ('Billy Cobham');

INSERT INTO `Album` (`Title`, `ArtistId`) VALUES
('For Those About To Rock We Salute You', 1), ('Let There Be Rock', 1),
('Balls to the Wall', 2), ('Restless and Wild', 2),
('Big Ones', 3), ('Jagged Little Pill', 4),
('Facelift', 5), ('Warner 25 Anos', 6),
('Plays Metallica By Four Cellos', 7), ('Audioslave', 8);

INSERT INTO `Genre` (`Name`) VALUES
('Rock'), ('Jazz'), ('Metal'), ('Alternative & Punk'), ('Rock And Roll'),
('Blues'), ('Latin'), ('Reggae'), ('Pop'), ('Soundtrack');

INSERT INTO `MediaType` (`Name`) VALUES
('MPEG audio file'), ('Protected AAC audio file'), ('Protected MPEG-4 video file'),
('Purchased AAC audio file'), ('AAC audio file');

INSERT INTO `Track` (`Name`, `AlbumId`, `MediaTypeId`, `GenreId`, `Composer`, `Milliseconds`, `Bytes`, `UnitPrice`) VALUES
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
('Love In An Elevator', 5, 1, 1, 'Steven Tyler, Joe Perry', 321828, 10552051, 0.99),
('All I Really Want', 6, 1, 4, 'Alanis Morissette & Glenn Ballard', 284891, 9375567, 0.99),
('You Oughta Know', 6, 1, 4, 'Alanis Morissette & Glenn Ballard', 249234, 8196916, 0.99),
('We Die Young', 7, 1, 1, 'Jerry Cantrell', 152084, 4925362, 0.99),
('Man In The Box', 7, 1, 1, 'Jerry Cantrell, Layne Staley', 286641, 9310272, 0.99),
('Desafinado', 8, 1, 2, NULL, 185338, 5990473, 0.99);

INSERT INTO `Employee` (`LastName`, `FirstName`, `Title`, `BirthDate`, `HireDate`, `Address`, `City`, `State`, `Country`, `PostalCode`, `Phone`, `Email`) VALUES
('Adams', 'Andrew', 'General Manager', '1962-02-18', '2002-08-14', '11120 Jasper Ave NW', 'Edmonton', 'AB', 'Canada', 'T5K 2N1', '+1 (780) 428-9482', 'andrew@chinookcorp.com'),
('Edwards', 'Nancy', 'Sales Manager', '1958-12-08', '2002-05-01', '825 8 Ave SW', 'Calgary', 'AB', 'Canada', 'T2P 2T3', '+1 (403) 262-3443', 'nancy@chinookcorp.com'),
('Peacock', 'Jane', 'Sales Support Agent', '1973-08-29', '2002-04-01', '1111 6 Ave SW', 'Calgary', 'AB', 'Canada', 'T2P 5M5', '+1 (403) 262-3443', 'jane@chinookcorp.com');

INSERT INTO `Customer` (`FirstName`, `LastName`, `Company`, `Address`, `City`, `State`, `Country`, `PostalCode`, `Phone`, `Email`, `SupportRepId`) VALUES
('Luiz', 'Goncalves', 'Embraer', 'Av. Brigadeiro Faria Lima, 2170', 'Sao Jose dos Campos', 'SP', 'Brazil', '12227-000', '+55 (12) 3923-5555', 'luiz@embraer.com.br', 3),
('Leonie', 'Kohler', NULL, 'Theodor-Heuss-Str. 34', 'Stuttgart', NULL, 'Germany', '70174', '+49 0711 2842222', 'leonekohler@surfeu.de', 3),
('Francois', 'Tremblay', NULL, '1498 rue Belanger', 'Montreal', 'QC', 'Canada', 'H2G 1A7', '+1 (514) 721-4711', 'ftremblay@gmail.com', 3),
('Bjorn', 'Hansen', NULL, 'Ullevalsveien 14', 'Oslo', NULL, 'Norway', '0171', '+47 22 44 22 22', 'bjorn.hansen@yahoo.no', 3),
('Helena', 'Holy', NULL, 'Klanova 9/506', 'Prague', NULL, 'Czech Republic', '14700', '+420 2 4177 0449', 'hholy@gmail.com', 3);

INSERT INTO `Invoice` (`CustomerId`, `InvoiceDate`, `BillingAddress`, `BillingCity`, `BillingCountry`, `Total`) VALUES
(1, '2024-01-01 00:00:00', 'Av. Brigadeiro Faria Lima, 2170', 'Sao Jose dos Campos', 'Brazil', 3.98),
(2, '2024-01-02 00:00:00', 'Theodor-Heuss-Str. 34', 'Stuttgart', 'Germany', 1.98),
(3, '2024-01-05 00:00:00', '1498 rue Belanger', 'Montreal', 'Canada', 5.94),
(4, '2024-02-01 00:00:00', 'Ullevalsveien 14', 'Oslo', 'Norway', 8.91),
(5, '2024-02-10 00:00:00', 'Klanova 9/506', 'Prague', 'Czech Republic', 0.99);

INSERT INTO `InvoiceLine` (`InvoiceId`, `TrackId`, `UnitPrice`, `Quantity`) VALUES
(1, 1, 0.99, 2), (1, 2, 0.99, 2),
(2, 3, 0.99, 2),
(3, 4, 0.99, 2), (3, 5, 0.99, 2), (3, 6, 0.99, 2),
(4, 7, 0.99, 3), (4, 8, 0.99, 3), (4, 9, 0.99, 3),
(5, 10, 0.99, 1);

INSERT INTO `Playlist` (`Name`) VALUES
('Music'), ('Movies'), ('TV Shows'), ('Audiobooks'), ('90s Music');

INSERT INTO `PlaylistTrack` (`PlaylistId`, `TrackId`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(5, 16), (5, 17);
