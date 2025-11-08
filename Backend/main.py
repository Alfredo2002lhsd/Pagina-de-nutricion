from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, Annotated, List
import datetime
from bson import ObjectId
from database import (
    connect_to_mongo, 
    close_mongo_connection, 
    get_histories_collection, 
    history_helper,
)

# Definición de tipos personalizados para Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

# =================================================================
# 1. MODELOS DE DATOS PYDANTIC (Se importan del archivo models.py si estuvieran separados, aquí se mantienen para simplificar)
# Si deseas un main.py limpio, mueve estos a models.py y usa 'from models import ...'
# Sin embargo, como nos enviaste models.py por separado, aquí reusaremos la definición de los modelos tal cual estaba en el main.py original.
# =================================================================

class MedicalHistoryBase(BaseModel):
    """Modelo base para la entrada de datos."""
    patient_email: EmailStr = Field(..., description="Correo electrónico del paciente.")
    doctor_id: str = Field(..., description="ID o nombre del doctor que realiza el historial.")
    diagnosis: str = Field(..., description="Diagnóstico principal.")
    treatment: Optional[str] = Field(None, description="Tratamiento o procedimiento aplicado.")
    notes: Optional[str] = Field(None, description="Notas adicionales.")

    class Config:
        json_schema_extra = {
            "example": {
                "patient_email": "juan.perez@email.com",
                "doctor_id": "Dr. Smith",
                "diagnosis": "Gripe estacional",
                "treatment": "Reposo y paracetamol",
                "notes": "Paciente responde bien al medicamento."
            }
        }

class MedicalHistoryCreate(MedicalHistoryBase):
    """Modelo para crear un nuevo registro (Input)."""
    pass

class MedicalHistoryOut(MedicalHistoryBase):
    """
    Modelo de salida que representa el historial médico en la base de datos.
    """
    id: PyObjectId = Field(..., alias="_id", description="ID único de MongoDB (ObjectId).")
    created_at: str = Field(..., description="Fecha y hora de creación del historial (ISO 8601).") 

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime.datetime: lambda dt: dt.isoformat()}
        json_schema_extra = {
            "example": {
                "_id": "60a1f0a1b0c1d2e3f4a5b6c7",
                "patient_email": "juan.perez@email.com",
                "doctor_id": "Dr. Smith",
                "diagnosis": "Gripe estacional",
                "treatment": "Reposo y paracetamol",
                "notes": "Paciente responde bien al medicamento.",
                "created_at": "2023-10-25T10:30:00+00:00"
            }
        }

# =================================================================
# 2. CONFIGURACIÓN DE FASTAPI
# =================================================================

app = FastAPI(
    title="API de Historial Médico",
    version="1.0.0",
    description="API REST asíncrona con FastAPI y MongoDB.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de conexión/desconexión de la base de datos
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

# =================================================================
# 3. RUTAS DE LA API
# =================================================================

@app.get("/status", tags=["Status"])
async def get_status():
    """Verifica el estado de la API y la conexión a la base de datos."""
    db_status = "OK"
    try:
        # Prueba la conexión realizando una operación trivial
        await get_histories_collection().find_one({}) 
    except ConnectionError:
        db_status = "Error de conexión"
    except Exception as e:
        db_status = f"Error DB: {str(e)}"

    return {
        "api_status": "OK",
        "database": db_status
    }

@app.post("/histories", response_model=MedicalHistoryOut, status_code=status.HTTP_201_CREATED, tags=["Historial Médico"])
async def create_medical_history(history: MedicalHistoryCreate):
    """Crea un nuevo registro de historial médico."""
    history_collection = get_histories_collection()
    
    # Prepara el documento con la fecha de creación en UTC
    history_dict = history.model_dump()
    history_dict["created_at"] = datetime.datetime.now(datetime.timezone.utc)
    
    new_history = await history_collection.insert_one(history_dict)
    
    # Recupera el documento insertado para el modelo de respuesta
    created_history = await history_collection.find_one({"_id": new_history.inserted_id})
    
    if created_history:
        # Usa el helper para formatear ObjectId y datetime
        return history_helper(created_history)
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error al recuperar el historial recién creado."
    )

@app.get(
    "/histories/patient/{email}",
    response_model=List[MedicalHistoryOut],
    tags=["Historial Médico"]
)
async def get_histories_by_patient(email: EmailStr):
    """Obtiene todos los historiales médicos para un paciente específico, ordenados por fecha descendente."""
    history_collection = get_histories_collection()
    
    # Busca por patient_email y ordena por fecha descendente (-1)
    cursor = history_collection.find(
        {"patient_email": email}
    ).sort("created_at", -1) 
    
    # Convierte los resultados usando el helper corregido
    histories = [history_helper(history) async for history in cursor]
    
    return histories

@app.delete(
    "/histories/{history_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Historial Médico"]
)
async def delete_medical_history(history_id: str):
    """Elimina un historial médico por su ID de MongoDB."""
    history_collection = get_histories_collection()
    
    try:
        object_id = ObjectId(history_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de historial inválido."
        )

    result = await history_collection.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Historial con ID {history_id} no encontrado."
        )
    
    return status.HTTP_204_NO_CONTENT