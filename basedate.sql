CREATE DATABASE empatia_db;

USE empatia_db;

CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    edad INT,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro DATE DEFAULT (CURRENT_DATE),
    activo BOOLEAN DEFAULT true
);

CREATE TABLE Interaccion (
    id_interaccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    fecha_hora DATETIME NOT NULL,
    mensaje_usuario TEXT,
    respuesta_sistema TEXT,
    emocion_detectada VARCHAR(50),

    FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE Actividad (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50)
);

CREATE TABLE RegistroActividad (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_actividad INT,
    fecha DATE NOT NULL,
    puntaje_agrado INT CHECK (puntaje_agrado >= 1 AND puntaje_agrado <= 10),
    frecuencia_deseada VARCHAR(20),
    reaccion VARCHAR(20),

    FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario),

    FOREIGN KEY (id_actividad)
    REFERENCES Actividad(id_actividad)
);

CREATE TABLE PreferenciaUsuario (
    id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    categoria VARCHAR(50),
    puntaje_promedio DECIMAL(3,2),
    frecuencia_promedio INT,
    ultima_actualizacion DATE,

    FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario)
);

CREATE TABLE RutinaPersonalizada (
    id_rutina INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    frecuencia VARCHAR(20),
    fecha_creacion DATE,

    FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario)
);