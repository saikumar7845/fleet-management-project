import os
from functools import wraps
import jwt
from datetime import datetime, timedelta, timezone
from flask import request, jsonify
from models import User

SECRET_KEY = os.environ.get('SECRET_KEY', 'fleet_super_secret_jwt_key_2026')

def generate_token(user):
    payload = {
        'id': user.id,
        'role': user.role,
        'email': user.email,
        'exp': datetime.now(timezone.utc) + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def jwt_required(roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'message': 'Authorization header missing or invalid'}), 401
            
            token = auth_header.split(' ')[1]
            try:
                data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                current_user = User.query.get(data['id'])
                if not current_user or not current_user.active:
                    return jsonify({'message': 'User not found or inactive'}), 401
                if roles and current_user.role not in roles:
                    return jsonify({'message': 'Forbidden: insufficient role permissions'}), 403
                request.current_user = current_user
            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Invalid token'}), 401
            
            return f(*args, **kwargs)
        return decorated
    return decorator
