import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Dict, Any, List


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/medical_db")
DATABASE_NAME = "medical_db"

client = None
db = None

#  FUNCIÓN DE CONEXIÓN 
async def connect_to_mongo():
    """Establece la conexión asíncrona a MongoDB con reintentos automáticos."""
    global client, db
    
    max_retries = 5
    wait_seconds = 5

    for intento in range(1, max_retries + 1):
        try:
            print(f"Intento {intento}/{max_retries} - Conectando a: {MONGO_URI}")
            
            client = AsyncIOMotorClient(MONGO_URI)
            
            # Lanzamos un 'ping' para asegurar que la base de datos responde realmente
            await client.admin.command('ping')
            
            db = client[DATABASE_NAME]
            print(f"¡Conexión a MongoDB exitosa en la base de datos: {DATABASE_NAME}!")
            return # Salimos de la función porque ya conectó

        except Exception as e:
            print(f"⚠️ Falló el intento {intento}: {e}")
            if intento < max_retries:
                print(f"⏳ Esperando {wait_seconds} segundos para reintentar...")
                await asyncio.sleep(wait_seconds)
            else:
                print(" ERROR CRÍTICO: No se pudo conectar a MongoDB después de varios intentos.")
                client = None
                db = None

# 3. FUNCIÓN PARA CERRAR
async def close_mongo_connection():
    """Cierra la conexión a MongoDB si existe."""
    global client
    if client:
        client.close()
        print("🔒 Conexión a MongoDB cerrada.")

# 4. HELPER PARA FORMATO DE DATOS
def history_helper(history: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma un registro de historial médico de MongoDB a un formato compatible con Pydantic/JSON.
    """
    return {
        "id": str(history["_id"]),
        "patient_email": history.get("patient_email"),
        "doctor_id": history.get("doctor_id"),
        "diagnosis": history.get("diagnosis"),
        "treatment": history.get("treatment"),
        "notes": history.get("notes"),
        # Serializa el objeto datetime a string ISO 8601
        "created_at": history["created_at"].isoformat() if history.get("created_at") else None
    }

# 5. OBTENER LA COLECCIÓN
def get_histories_collection():
    """Devuelve la referencia a la colección de historiales."""
    if db is None: 
        # pero por ahora devolvemos un objeto vacío para que no explote inmediatamente
        print("Advertencia: Intentando acceder a la colección sin conexión a DB")
        return None
    return db.get_collection("histories")