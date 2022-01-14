create type Gender as enum('M', 'F', 'O');
CREATE TABLE IF NOT EXISTS Users( 
       id       INTEGER  NOT NULL PRIMARY KEY, 
       email    text NOT NULL, 
       password text NOT NULL, 
       birthday DATE  NOT NULL, 
       gender   Gender NOT NULL, 
       isadmin  BOOLEAN  default false
);

CREATE TABLE IF NOT EXISTS Keywords( 
       id   INTEGER  NOT NULL PRIMARY KEY, 
       word text not null
);



CREATE TABLE IF NOT EXISTS Movies(
  id                INTEGER  NOT NULL PRIMARY KEY ,
  title             text NOT NULL,
  adult             text NOT NULL,
  original_language text NOT NULL,
  overview          text,
  release_date      DATE  NOT NULL,
  runtime           real NOT NULL,
  rentprice         integer default 3,
  purchaseprice     integer default 6,
  avgrating         numeric,
  numrating         integer default 0,        
  ispromoted        boolean default false,
  imdbid            varchar(9),        
  url               text
);

CREATE TABLE IF NOT EXISTS Genres(
   id   INTEGER  not null PRIMARY KEY,
   name text not null
);

CREATE TABLE IF NOT EXISTS Moviegenre(
   movieid INTEGER  not null,
   genre   INTEGER  not null,
   primary key(movieid, genre),
   foreign key (genre) references Genres(id) ON DELETE CASCADE,
   foreign key (movieid) references Movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Moviekeyword(
   movieid INTEGER  NOT NULL,
   keyword INTEGER  NOT NULL,
   primary key(movieid, keyword),
   foreign key (keyword) references Keywords(id) ON DELETE CASCADE,
   foreign key (movieid) references Movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Ratings(
   userId    INTEGER  NOT NULL,
   movieId   INTEGER  NOT NULL,
   rating    NUMERIC(3,1) NOT NULL,
   primary key(userId, movieId),
   foreign key (movieId) references Movies(id) ON DELETE CASCADE,
   foreign key (userId) references Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Buys (
   userId    INTEGER  NOT NULL,
   movieId   INTEGER  NOT NULL,
   ptime    date NOT NULL, -- start date/purchase date
   endtime      date, -- end date, if null means buy
   foreign key (movieId) references Movies(id) ON DELETE CASCADE,
   foreign key (userId) references Users(id) ON DELETE CASCADE
);

create table if not exists carts (
	userId   integer,
	movieId  integer,
	isrent   boolean,
	primary key(userId, movieId, isrent),
	foreign key (userId) references Users(id) on delete cascade,
	foreign key (movieId) references Movies(id) on delete cascade
);

-- the newly create table for user preference survey on genres
create table surveys (
    userid  integer references users(id) on delete cascade,
    genre integer references genres(id) on delete cascade,
    primary key (userid, genre)
);


create or replace function update_avg() RETURNS TRIGGER AS $$
begin
	update movies set avgrating = (select avg(rating) from ratings where movieid = id) where id = old.movieid;
	update movies set numrating = (select count(userid) from ratings where movieid = id) where id = old.movieid;
	return new;
end;
$$ language plpgsql;

CREATE TRIGGER check_update AFTER INSERT OR UPDATE ON ratings for each row EXECUTE PROCEDURE update_avg();

