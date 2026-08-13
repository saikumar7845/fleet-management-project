from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='driver')
    phone = db.Column(db.String(30), nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "_id": str(self.id),
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone or "",
            "active": self.active
        }

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    purchase_date = db.Column(db.DateTime, nullable=False)
    last_service_date = db.Column(db.DateTime, nullable=False)
    service_interval_km = db.Column(db.Integer, default=10000)
    current_odometer = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='available')
    assigned_driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    current_load = db.Column(db.String(200), default='Empty / Unloaded')
    load_weight_kg = db.Column(db.Float, default=0.0)
    load_status = db.Column(db.String(50), default='unloaded')

    assigned_driver = db.relationship('User', foreign_keys=[assigned_driver_id])

    def to_dict(self):
        return {
            "_id": str(self.id),
            "id": str(self.id),
            "registrationNumber": self.registration_number,
            "type": self.type,
            "purchaseDate": self.purchase_date.isoformat() if self.purchase_date else None,
            "lastServiceDate": self.last_service_date.isoformat() if self.last_service_date else None,
            "serviceIntervalKm": self.service_interval_km,
            "currentOdometer": self.current_odometer,
            "status": self.status,
            "assignedDriver": self.assigned_driver.to_dict() if self.assigned_driver else None,
            "currentLoad": self.current_load or "Empty / Unloaded",
            "loadWeightKg": self.load_weight_kg or 0.0,
            "loadStatus": self.load_status or "unloaded"
        }

class Trip(db.Model):
    __tablename__ = 'trips'
    id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    start_location = db.Column(db.String(150), nullable=False)
    end_location = db.Column(db.String(150), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    distance_km = db.Column(db.Float, nullable=False)
    fuel_used_litres = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    cargo_details = db.Column(db.String(200), nullable=True)
    returned_vehicle = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    driver = db.relationship('User', foreign_keys=[driver_id])
    vehicle = db.relationship('Vehicle', foreign_keys=[vehicle_id])

    def to_dict(self):
        return {
            "_id": str(self.id),
            "id": str(self.id),
            "driver": self.driver.to_dict() if self.driver else None,
            "vehicle": self.vehicle.to_dict() if self.vehicle else None,
            "startLocation": self.start_location,
            "endLocation": self.end_location,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None,
            "distanceKm": self.distance_km,
            "fuelUsedLitres": self.fuel_used_litres,
            "notes": self.notes or "",
            "cargoDetails": self.cargo_details or "",
            "returnedVehicle": self.returned_vehicle or False
        }

class Maintenance(db.Model):
    __tablename__ = 'maintenance'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    service_date = db.Column(db.DateTime, nullable=False)
    service_type = db.Column(db.String(100), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    next_service_date = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='in_maintenance')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    vehicle = db.relationship('Vehicle', foreign_keys=[vehicle_id])

    def to_dict(self):
        return {
            "_id": str(self.id),
            "id": str(self.id),
            "vehicle": self.vehicle.to_dict() if self.vehicle else None,
            "serviceDate": self.service_date.isoformat() if self.service_date else None,
            "serviceType": self.service_type,
            "cost": self.cost,
            "nextServiceDate": self.next_service_date.isoformat() if self.next_service_date else None,
            "notes": self.notes or "",
            "status": getattr(self, 'status', 'in_maintenance') or "in_maintenance"
        }
