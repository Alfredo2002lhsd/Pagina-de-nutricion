from flask import Blueprint, request, jsonify
from db import get_db_connection

progreso_bp = Blueprint('progreso', __name__)

# RUTA POST: Registrar Progreso
@progreso_bp.route('/progreso', methods=['POST'])

def registrar_progreso():
    data = request.get_json()
    id_usuario = data.get('id_usuario') 
    peso = data.get('peso')
    cintura = data.get('circunferencia_cintura')
    comentarios = data.get('comentarios_usuario')

    if not id_usuario or not peso:
        return jsonify({'error': 'id_usuario y peso son obligatorios'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO progreso (id_usuario, peso, circunferencia_cintura, comentarios_usuario)
        VALUES (?, ?, ?, ?)
    """, (id_usuario, peso, cintura, comentarios))
    conn.commit()
    nuevo_id = cursor.lastrowid
    conn.close()

    return jsonify({'id_progreso': nuevo_id}), 201

# RUTA GET: Obtener Historial
@progreso_bp.route('/progreso/<int:id_usuario>', methods=['GET'])

def obtener_progreso(id_usuario):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM progreso
        WHERE id_usuario = ?
        ORDER BY fecha_registro DESC
    """, (id_usuario,))
    progreso = cursor.fetchall()
    conn.close()

    progreso_list = [dict(row) for row in progreso]

    return jsonify(progreso_list)

# RUTA PUT: Actualizar Progreso
@progreso_bp.route('/progreso/<int:id_progreso>', methods=['PUT'])

def actualizar_progreso(id_progreso):
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id_usuario FROM progreso WHERE id_progreso = ?", (id_progreso,))
    progreso = cursor.fetchone()
    
    if not progreso:
        conn.close()
        return jsonify({'error': 'Registro no encontrado'}), 404
    
    # Actualizar
    cursor.execute("""
        UPDATE progreso 
        SET peso = ?, circunferencia_cintura = ?, comentarios_usuario = ?
        WHERE id_progreso = ?
    """, (data.get('peso'), data.get('circunferencia_cintura'), 
          data.get('comentarios_usuario'), id_progreso))
    
    conn.commit()
    conn.close()
    
    return jsonify({'mensaje': 'Progreso actualizado'})

# RUTA DELETE: Eliminar Progreso
@progreso_bp.route('/progreso/<int:id_progreso>', methods=['DELETE'])

def eliminar_progreso(id_progreso):
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar que el registro existe antes de eliminar
    cursor.execute("SELECT id_usuario FROM progreso WHERE id_progreso = ?", (id_progreso,))
    progreso = cursor.fetchone()
    
    if not progreso:
        conn.close()
        return jsonify({'error': 'Registro no encontrado'}), 404
    
    # Eliminar
    cursor.execute("DELETE FROM progreso WHERE id_progreso = ?", (id_progreso,))
    conn.commit()
    conn.close()
    
    return jsonify({'mensaje': 'Progreso eliminado'})