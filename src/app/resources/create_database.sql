# MySQL scripts for dropping existing tables and recreating the database table structure

### DROP EVERYTHING ###
# Tables/views must be dropped in reverse order due to referential constraints (foreign keys).
DROP TABLE IF EXISTS `blog_reactions`;
DROP TABLE IF EXISTS `blog_comments`;
DROP TABLE IF EXISTS `blog_categories`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `blog`;
DROP TABLE IF EXISTS `city`;
DROP TABLE IF EXISTS `user`;

### TABLES ###
# Tables must be created in a particular order due to referential constraints i.e. foreign keys.

CREATE TABLE `user` (
  `id`          int(11)       NOT NULL AUTO_INCREMENT,
  `email`       varchar(256)  NOT NULL,
  `first_name`  varchar(64)   NOT NULL,
  `last_name`   varchar(64)   NOT NULL,
  `image_filename`  varchar(64)   DEFAULT NULL,
  `password`    varchar(256)  NOT NULL COMMENT 'Only store the hash here, not the actual password!',
  `auth_token`  varchar(256)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`email`)
);

CREATE TABLE `city` (
  `id`         int(11)     NOT NULL   AUTO_INCREMENT,
  `name`       varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

CREATE TABLE `category` (
  `id`          int(11)     NOT NULL    AUTO_INCREMENT,
  `name`        varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

CREATE TABLE `blog` (
  `id`                          int(11)         NOT NULL AUTO_INCREMENT,
  `title`                       VARCHAR(128)    NOT NULL,
  `description`                 VARCHAR(1024)   NOT NULL,
  `creation_date`               DATETIME        NOT NULL,
  `series`                      VARCHAR(64)     NULL,
  `image_filename`              VARCHAR(64)     NULL,
  `creator_id`                  int(11)         NOT NULL,
  `city_id`                     int(11)         NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`creator_id`)    REFERENCES `user` (`id`),
  FOREIGN KEY (`city_id`)       REFERENCES `city` (`id`)
);

CREATE TABLE `blog_categories` (
    `id`            int(11)     NOT NULL    AUTO_INCREMENT,
    `blog_id`       int(11)     NOT NULL,
    `category_id`   int(11)     NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`blog_id`, `category_id`),
    FOREIGN KEY (`blog_id`) REFERENCES `blog` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
);

CREATE TABLE `blog_reactions` (
  `id`                          int(11)         NOT NULL AUTO_INCREMENT,
  `blog_id`                     int(11)         NOT NULL,
  `user_id`                     int(11)         NOT NULL,
  `reaction`                    VARCHAR(16)     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`blog_id`, `user_id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blog` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
);

CREATE TABLE `blog_comments` (
  `id`                          int(11)         NOT NULL AUTO_INCREMENT,
  `blog_id`                     int(11)         NOT NULL,
  `user_id`                     int(11)         NOT NULL,
  `parent_id`                   int(11)         NULL,
  `comment`                     VARCHAR(512)    NULL,
  `timestamp`                   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blog` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  FOREIGN KEY (parent_id) REFERENCES `blog_comments` (`id`)
);
