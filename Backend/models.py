from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, Annotated, List
import datetime
from bson import ObjectId

# Definición de tipos personalizados para Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]


# MODELOS BASE


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


# MODELOS DE ENTRADA Y SALIDA

class MedicalHistoryCreate(MedicalHistoryBase):
    """Modelo para crear un nuevo registro (Input). Hereda de MedicalHistoryBase."""
    pass

class MedicalHistoryOut(MedicalHistoryBase):
    """
    Modelo de salida que representa el historial médico en la base de datos.
    Incluye el ID de MongoDB y la marca de tiempo.
    """
    # Mapea el _id de MongoDB al campo 'id' de la respuesta JSON
    id: PyObjectId = Field(..., alias="_id", description="ID único de MongoDB (ObjectId).")
    # Campo de fecha de creación, serializado como string ISO 8601
    created_at: str = Field(..., description="Fecha y hora de creación del historial (ISO 8601).") 

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        # Asegura la serialización correcta de ObjectId y datetime a string
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