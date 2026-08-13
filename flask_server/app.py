import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import create_engine
from models import db, User
from routes import auth_bp, vehicles_bp, drivers_bp, trips_bp, maintenance_bp, dashboard_bp

load_dotenv()

def get_working_db_uri():
    default_mysql_uri = os.environ.get('MYSQL_URI', 'mysql+pymysql://root:@localhost:3306/fleet_management')
    try:
        engine = create_engine(default_mysql_uri, connect_args={'connect_timeout': 2})
        with engine.connect() as conn:
            pass
        print("Using MySQL Database:", default_mysql_uri)
        return default_mysql_uri
    except Exception as e:
        print("MySQL local database connection unavailable. Falling back to SQLite database.")
        return 'sqlite:///fleet_management.db'

def create_app():
    app = Flask(__name__)
    CORS(app)

    db_uri = get_working_db_uri()
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fleet_super_secret_jwt_key_2026')

    db.init_app(app)

    with app.app_context():
        db.create_all()

        # Auto-seed if empty
        if User.query.count() == 0:
            from seed import seed_database
            seed_database()

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(trips_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(dashboard_bp)

    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Fleet Management API',
            'service': 'fleet-management-flask-api',
            'status': 'running',
            'endpoints': {
                'auth': '/api/auth/login',
                'vehicles': '/api/vehicles',
                'drivers': '/api/drivers',
                'trips': '/api/trips',
                'maintenance': '/api/maintenance',
                'dashboard': '/api/dashboard',
                'health': '/api/health'
            }
        })

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'ok': True, 'service': 'fleet-management-flask-api'})

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
