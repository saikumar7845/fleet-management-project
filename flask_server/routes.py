from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
import bcrypt
from models import db, User, Vehicle, Trip, Maintenance
from auth import generate_token, jwt_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')
drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')
trips_bp = Blueprint('trips', __name__, url_prefix='/api/trips')
maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

# --- AUTH ROUTES ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'message': 'Invalid credentials'}), 401

    token = generate_token(user)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'message': 'Name, email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    # STRICT ACCESS RESTRICTION: Self-registration strictly assigns 'driver' role (restricted access)
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(name=name, email=email, phone=phone, password=hashed_pw, role='driver')
    db.session.add(user)
    db.session.commit()

    token = generate_token(user)
    return jsonify({
        'message': 'Registered successfully with restricted driver access',
        'token': token,
        'user': user.to_dict()
    }), 201


# --- VEHICLES ROUTES ---
@vehicles_bp.route('', methods=['GET'])
@jwt_required()
def get_vehicles():
    u = request.current_user
    if u.role == 'driver':
        vehicles = Vehicle.query.filter_by(assigned_driver_id=u.id).all()
    else:
        vehicles = Vehicle.query.all()
    return jsonify([v.to_dict() for v in vehicles])

@vehicles_bp.route('', methods=['POST'])
@jwt_required()
def create_vehicle():
    data = request.get_json() or {}
    reg = data.get('registrationNumber', '').strip().upper()
    v_type = data.get('type', '').strip()
    p_date = data.get('purchaseDate')
    s_date = data.get('lastServiceDate')
    odo = data.get('currentOdometer', 0)

    if not reg or not v_type:
        return jsonify({'message': 'Registration number and vehicle type are required'}), 400

    if Vehicle.query.filter_by(registration_number=reg).first():
        return jsonify({'message': 'Vehicle registration already exists'}), 400

    now_dt = datetime.now(timezone.utc).replace(tzinfo=None)
    try:
        purchase_dt = datetime.fromisoformat(p_date.replace('Z', '')) if p_date else now_dt
    except (ValueError, TypeError):
        purchase_dt = now_dt

    try:
        service_dt = datetime.fromisoformat(s_date.replace('Z', '')) if s_date else now_dt
    except (ValueError, TypeError):
        service_dt = now_dt

    v = Vehicle(
        registration_number=reg,
        type=v_type,
        purchase_date=purchase_dt,
        last_service_date=service_dt,
        current_odometer=int(odo) if odo else 0
    )
    db.session.add(v)
    db.session.commit()
    return jsonify(v.to_dict()), 201

def _get_vehicle(v_id_param):
    if not v_id_param:
        return None
    s_param = str(v_id_param).strip()
    
    try:
        v_id = int(s_param)
        v = Vehicle.query.get(v_id)
        if v: return v
    except (ValueError, TypeError):
        pass

    if s_param.lower().startswith('v') and s_param[1:].isdigit():
        try:
            v_id = int(s_param[1:])
            v = Vehicle.query.get(v_id)
            if v: return v
        except (ValueError, TypeError):
            pass

    v = Vehicle.query.filter_by(registration_number=s_param).first()
    if v: return v

    return Vehicle.query.filter(Vehicle.registration_number.ilike(s_param)).first()

@vehicles_bp.route('/<vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    vehicle = _get_vehicle(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    vehicle.assigned_driver_id = None
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully', 'id': str(vehicle_id)})

@vehicles_bp.route('/<vehicle_id>/assign', methods=['POST'])
@jwt_required()
def assign_vehicle(vehicle_id):
    data = request.get_json() or {}
    driver_id = data.get('driverId')
    
    vehicle = _get_vehicle(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    if not driver_id:
        vehicle.assigned_driver_id = None
        vehicle.status = 'available'
        vehicle.load_status = 'unloaded'
        vehicle.current_load = 'Empty / Unloaded'
        vehicle.load_weight_kg = 0.0
    else:
        driver = None
        try:
            d_id = int(driver_id)
            driver = User.query.filter_by(id=d_id, role='driver').first()
        except (ValueError, TypeError):
            pass

        if not driver:
            driver = User.query.filter_by(email=str(driver_id).strip().lower(), role='driver').first()

        if not driver:
            return jsonify({'message': 'Driver not found'}), 404

        vehicle.assigned_driver_id = driver.id
        vehicle.status = 'assigned'
    
    db.session.commit()
    return jsonify(vehicle.to_dict())

@vehicles_bp.route('/<vehicle_id>/unassign', methods=['POST'])
@jwt_required()
def unassign_vehicle(vehicle_id):
    vehicle = _get_vehicle(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    vehicle.assigned_driver_id = None
    vehicle.status = 'available'
    vehicle.load_status = 'unloaded'
    vehicle.current_load = 'Empty / Unloaded'
    vehicle.load_weight_kg = 0.0
    db.session.commit()
    return jsonify(vehicle.to_dict())

@vehicles_bp.route('/<vehicle_id>/return', methods=['POST'])
@jwt_required()
def return_vehicle(vehicle_id):
    u = request.current_user
    vehicle = _get_vehicle(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404
    
    if u.role == 'driver' and vehicle.assigned_driver_id != u.id:
        return jsonify({'message': 'You can only return a vehicle assigned to you'}), 403

    vehicle.assigned_driver_id = None
    vehicle.status = 'available'
    vehicle.load_status = 'unloaded'
    vehicle.current_load = 'Empty / Unloaded'
    vehicle.load_weight_kg = 0.0

    db.session.commit()
    return jsonify({
        'message': 'Vehicle successfully returned and available for new load assignment',
        'vehicle': vehicle.to_dict()
    })

@vehicles_bp.route('/<vehicle_id>/load', methods=['POST'])
@jwt_required()
def load_vehicle(vehicle_id):
    data = request.get_json() or {}
    cargo_desc = data.get('currentLoad', '').strip() or data.get('cargoDescription', '').strip()
    weight = data.get('loadWeightKg', 0)

    if not cargo_desc:
        return jsonify({'message': 'Cargo description is required for loading'}), 400

    vehicle = _get_vehicle(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    vehicle.current_load = cargo_desc
    vehicle.load_weight_kg = float(weight) if weight else 0.0
    vehicle.load_status = 'loaded'

    db.session.commit()
    return jsonify({
        'message': f'Vehicle newly loaded with {cargo_desc} ({weight} kg)',
        'vehicle': vehicle.to_dict()
    })

@vehicles_bp.route('/<vehicle_id>/release-maintenance', methods=['POST'])
@jwt_required(['admin', 'manager'])
def release_vehicle_maintenance(vehicle_id):
    vehicle = _get_vehicle(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404

    vehicle.status = 'available'
    vehicle.last_service_date = datetime.now(timezone.utc).replace(tzinfo=None)
    vehicle.current_odometer = 0
    records = Maintenance.query.filter_by(vehicle_id=vehicle.id).all()
    for r in records:
        r.status = 'released'
    db.session.commit()
    return jsonify({
        'message': f'Vehicle {vehicle.registration_number} successfully released from maintenance and ready for operations',
        'vehicle': vehicle.to_dict()
    })

# --- DRIVERS ROUTES ---
@drivers_bp.route('', methods=['GET'])
@jwt_required()
def get_drivers():
    drivers = User.query.filter_by(role='driver').all()
    result = []
    for d in drivers:
        dd = d.to_dict()
        v = Vehicle.query.filter_by(assigned_driver_id=d.id).first()
        dd['assignedVehicle'] = v.registration_number if v else None
        result.append(dd)
    return jsonify(result)

@drivers_bp.route('', methods=['POST'])
@jwt_required()
def create_driver():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    raw_pw = data.get('password', 'Driver@123')

    if not name or not email:
        return jsonify({'message': 'Name and email are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 400

    hashed_pw = bcrypt.hashpw(raw_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    driver = User(name=name, email=email, phone=phone, password=hashed_pw, role='driver')
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201

@drivers_bp.route('/<int:driver_id>', methods=['DELETE'])
@jwt_required()
def delete_driver(driver_id):
    u = request.current_user
    if u.role not in ['admin', 'manager'] and u.id != driver_id:
        return jsonify({'message': 'Access denied'}), 403

    driver = User.query.filter_by(id=driver_id, role='driver').first()
    if not driver:
        return jsonify({'message': 'Driver not found'}), 404
    
    # Unassign driver from any assigned vehicles
    assigned_vehicles = Vehicle.query.filter_by(assigned_driver_id=driver.id).all()
    for v in assigned_vehicles:
        v.assigned_driver_id = None
        v.status = 'available'
        v.load_status = 'unloaded'
        v.current_load = 'Empty / Unloaded'
        v.load_weight_kg = 0.0

    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Driver deleted successfully', 'id': str(driver_id)})

# --- TRIPS ROUTES ---
@trips_bp.route('', methods=['GET'])
@jwt_required()
def get_trips():
    u = request.current_user
    if u.role == 'driver':
        trips = Trip.query.filter_by(driver_id=u.id).order_by(Trip.start_time.desc()).all()
    else:
        trips = Trip.query.order_by(Trip.start_time.desc()).all()
    return jsonify([t.to_dict() for t in trips])

@trips_bp.route('', methods=['POST'])
@jwt_required()
def create_trip():
    u = request.current_user
    data = request.get_json() or {}
    vehicle_id = data.get('vehicle')
    start_loc = data.get('startLocation')
    end_loc = data.get('endLocation')
    start_time = data.get('startTime')
    end_time = data.get('endTime')
    distance = data.get('distanceKm')
    fuel = data.get('fuelUsedLitres')
    notes = data.get('notes', '')
    cargo_details = data.get('cargoDetails', '').strip()
    return_vehicle_flag = data.get('returnVehicle', False)

    if not vehicle_id or not start_loc or not end_loc or not start_time or not end_time or distance is None or fuel is None:
        return jsonify({'message': 'Missing required trip fields'}), 400

    v = Vehicle.query.get_or_404(int(vehicle_id))
    
    # Use current vehicle load if cargo_details is empty
    if not cargo_details and v.current_load and v.current_load != 'Empty / Unloaded':
        cargo_details = f"{v.current_load} ({v.load_weight_kg or 0} kg)"

    trip = Trip(
        driver_id=u.id,
        vehicle_id=v.id,
        start_location=start_loc,
        end_location=end_loc,
        start_time=datetime.fromisoformat(start_time.replace('Z', '')),
        end_time=datetime.fromisoformat(end_time.replace('Z', '')),
        distance_km=float(distance),
        fuel_used_litres=float(fuel),
        notes=notes,
        cargo_details=cargo_details,
        returned_vehicle=True
    )
    v.current_odometer += int(float(distance))

    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201

# --- MAINTENANCE ROUTES ---
@maintenance_bp.route('', methods=['GET'])
@jwt_required(['admin', 'manager'])
def get_maintenance():
    records = Maintenance.query.order_by(Maintenance.service_date.desc()).all()
    return jsonify([m.to_dict() for m in records])

@maintenance_bp.route('', methods=['POST'])
@jwt_required(['admin', 'manager'])
def create_maintenance():
    data = request.get_json() or {}
    vehicle_id = data.get('vehicle')
    service_date = data.get('serviceDate')
    service_type = data.get('serviceType')
    cost = data.get('cost')
    next_service_date = data.get('nextServiceDate')
    notes = data.get('notes', '')

    if not vehicle_id or not service_date or not service_type or cost is None or cost == '' or not next_service_date:
        return jsonify({'message': 'Missing required maintenance fields'}), 400

    try:
        v_id = int(vehicle_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid vehicle ID provided'}), 400

    v = Vehicle.query.get(v_id)
    if not v:
        return jsonify({'message': 'Selected vehicle not found'}), 404

    try:
        cost_val = float(cost)
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid cost amount provided'}), 400

    try:
        s_dt = datetime.fromisoformat(str(service_date).replace('Z', ''))
        n_dt = datetime.fromisoformat(str(next_service_date).replace('Z', ''))
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid service date format'}), 400

    rec = Maintenance(
        vehicle_id=v.id,
        service_date=s_dt,
        service_type=service_type,
        cost=cost_val,
        next_service_date=n_dt,
        notes=notes,
        status='in_maintenance'
    )
    v.last_service_date = s_dt
    v.status = 'maintenance'
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.to_dict()), 201

@maintenance_bp.route('/<int:maintenance_id>/release', methods=['POST'])
@jwt_required(['admin', 'manager'])
def release_maintenance(maintenance_id):
    rec = Maintenance.query.get_or_404(maintenance_id)
    v = Vehicle.query.get_or_404(rec.vehicle_id)
    v.status = 'available'
    v.last_service_date = datetime.now(timezone.utc).replace(tzinfo=None)
    v.current_odometer = 0
    rec.status = 'released'
    db.session.commit()
    return jsonify({
        'message': f'Vehicle {v.registration_number} successfully released from maintenance and ready for operations',
        'maintenance': rec.to_dict(),
        'vehicle': v.to_dict()
    })

@maintenance_bp.route('/<int:maintenance_id>', methods=['DELETE'])
@jwt_required(['admin', 'manager'])
def delete_maintenance(maintenance_id):
    rec = Maintenance.query.get_or_404(maintenance_id)
    db.session.delete(rec)
    db.session.commit()
    return jsonify({
        'message': 'Maintenance record deleted successfully',
        'id': str(maintenance_id)
    })


# --- DASHBOARD ROUTES ---
@dashboard_bp.route('', methods=['GET'])
@jwt_required()
def get_dashboard():
    vehicles = Vehicle.query.all()
    drivers = User.query.filter_by(role='driver').all()
    trips = Trip.query.all()
    maintenance_records = Maintenance.query.all()

    total_vehicles = len(vehicles)
    assigned = len([v for v in vehicles if v.status == 'assigned'])
    utilization = round((assigned / total_vehicles * 100), 1) if total_vehicles > 0 else 0

    total_dist = sum([t.distance_km for t in trips])
    total_fuel = sum([t.fuel_used_litres for t in trips])
    total_cost = sum([m.cost for m in maintenance_records])

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    due_maint = []
    for v in vehicles:
        is_due = False
        if v.last_service_date and (now - v.last_service_date).days > 90:
            is_due = True
        if v.current_odometer >= v.service_interval_km:
            is_due = True
        if v.status == 'maintenance':
            is_due = True
        if is_due:
            due_maint.append({
                'id': str(v.id),
                '_id': str(v.id),
                'registrationNumber': v.registration_number,
                'lastServiceDate': v.last_service_date.isoformat() if v.last_service_date else None,
                'status': v.status
            })

    by_vehicle = []
    for v in vehicles:
        v_trips = [t for t in trips if t.vehicle_id == v.id]
        by_vehicle.append({
            'registrationNumber': v.registration_number,
            'distanceKm': sum([t.distance_km for t in v_trips]),
            'fuelUsed': sum([t.fuel_used_litres for t in v_trips]),
            'trips': len(v_trips)
        })

    return jsonify({
        'counts': {
            'vehicles': total_vehicles,
            'drivers': len(drivers),
            'trips': len(trips),
            'dueMaintenance': len(due_maint)
        },
        'totalDistance': round(total_dist, 1),
        'totalFuel': round(total_fuel, 1),
        'totalMaintenanceCost': round(total_cost, 2),
        'utilization': utilization,
        'byVehicle': by_vehicle,
        'dueMaintenance': due_maint
    })
