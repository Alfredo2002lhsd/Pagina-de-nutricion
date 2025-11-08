FROM python:3.11-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia e instala las dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el contenido de tu carpeta local 'Backend/' 
COPY Backend/ .

# Expone el puerto que usa Uvicorn
EXPOSE 8000

# Comando de inicio del servidor Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]