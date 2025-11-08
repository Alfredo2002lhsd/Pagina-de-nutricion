import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import Dict, Any, List

# Obtener la URI de conexión desde la variable de entorno de Docker Compose
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/medical_db")
DATABASE_NAME = "medical_db"

client = None
db = None

# Función para la conexión a la base de datos
async def connect_to_mongo():
    """Establece la conexión asíncrona a MongoDB."""
    global client, db
    try:
        print(f"Intentando conectar a MongoDB en: {MONGO_URI}")
        client = AsyncIOMotorClient(MONGO_URI)
        await client.admin.command('ping')
        db = client[DATABASE_NAME]
        print("Conexión a MongoDB exitosa.")
    except Exception as e:
        print(f"Error al conectar a MongoDB: {e}")
        client = None
        db = None

# Función para cerrar la conexión
async def close_mongo_connection():
    """Cierra la conexión a MongoDB si existe."""
    global client
    if client:
        client.close()
        print("Conexión a MongoDB cerrada.")

# Helper para transformar un registro de MongoDB a un diccionario Pydantic
def history_helper(history: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforma un registro de historial médico de MongoDB a un formato compatible con Pydantic/JSON.
    """
    return {
        "id": str(history["_id"]),
        "patient_email": history["patient_email"],
        "doctor_id": history["doctor_id"],
        "diagnosis": history["diagnosis"],
        "treatment": history["treatment"],
        "notes": history["notes"],
        # Serializa el objeto datetime a string ISO 8601
        "created_at": history["created_at"].isoformat()
    }

# COLECCIONES
def get_histories_collection():
    """Retorna la colección de historiales médicos."""
    if db is None:
        raise ConnectionError("No se ha establecido la conexión a la base de datos.")
    return db.histories