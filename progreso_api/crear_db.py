import sqlite3

conn = sqlite3.connect('progreso.db')
cursor = conn.cursor()


cursor.execute("""
CREATE TABLE IF NOT EXISTS progreso (
    id_progreso INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    fecha_registro TEXT DEFAULT (datetime('now', 'localtime')),
    peso REAL NOT NULL,
    circunferencia_cintura REAL,
    comentarios_usuario TEXT
);
""")

conn.commit()
conn.close()
print("Base de datos configurada para seguimiento de progreso (sin usuarios).")