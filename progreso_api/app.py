from flask import Flask
from flask_cors import CORS
from progreso_routes import progreso_bp 

app = Flask(__name__)
CORS(app)

app.register_blueprint(progreso_bp, url_prefix='/api') 

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)