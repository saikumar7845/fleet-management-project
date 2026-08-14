from datetime import datetime, timedelta, timezone
import bcrypt
from models import db, User, Vehicle, Trip, Maintenance

def seed_database():
    db.drop_all()
    db.create_all()

    pw_admin = bcrypt.hashpw('Admin@123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    pw_driver = bcrypt.hashpw('Driver@123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    admin = User(name='Fleet Admin', email='admin@fleet.com', password=pw_admin, role='admin', phone='9000000001')
    driver = User(name='Ravi Kumar', email='driver@fleet.com', password=pw_driver, role='driver', phone='9000000002')
    driver2 = User(name='Priya Sharma', email='priya@fleet.com', password=pw_driver, role='driver', phone='9000000003')

    db.session.add_all([admin, driver, driver2])
    db.session.commit()

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    v1 = Vehicle(
        registration_number='AP39AB1234',
        type='Delivery Van',
        purchase_date=now - timedelta(days=900),
        last_service_date=now - timedelta(days=25),
        current_odometer=45200,
        status='available',
        assigned_driver_id=None,
        current_load='Empty / Unloaded',
        load_weight_kg=0.0,
        load_status='unloaded'
    )
    v2 = Vehicle(
        registration_number='AP40CD5678',
        type='Field Service Car',
        purchase_date=now - timedelta(days=600),
        last_service_date=now - timedelta(days=105),
        current_odometer=38100,
        status='available',
        assigned_driver_id=None,
        current_load='Empty / Unloaded',
        load_weight_kg=0.0,
        load_status='unloaded'
    )
    v3 = Vehicle(
        registration_number='AP41EF9012',
        type='Pickup Truck',
        purchase_date=now - timedelta(days=1200),
        last_service_date=now - timedelta(days=45),
        current_odometer=67000,
        status='available',
        current_load='Empty / Unloaded',
        load_weight_kg=0.0,
        load_status='unloaded'
    )

    db.session.add_all([v1, v2, v3])
    db.session.commit()

    t1 = Trip(
        driver_id=driver.id,
        vehicle_id=v1.id,
        start_location='Vijayawada',
        end_location='Guntur',
        start_time=now - timedelta(days=2),
        end_time=now - timedelta(days=2) + timedelta(hours=2),
        distance_km=65,
        fuel_used_litres=8,
        cargo_details='Electronics Consignment (450 kg)',
        returned_vehicle=False
    )
    t2 = Trip(
        driver_id=driver.id,
        vehicle_id=v1.id,
        start_location='Guntur',
        end_location='Tenali',
        start_time=now - timedelta(days=1),
        end_time=now - timedelta(days=1) + timedelta(minutes=90),
        distance_km=48,
        fuel_used_litres=6,
        cargo_details='Retail Electronics Parcel',
        returned_vehicle=False
    )
    t3 = Trip(
        driver_id=driver2.id,
        vehicle_id=v2.id,
        start_location='Visakhapatnam',
        end_location='Anakapalle',
        start_time=now - timedelta(days=3),
        end_time=now - timedelta(days=3) + timedelta(hours=2),
        distance_km=70,
        fuel_used_litres=7.5,
        cargo_details='Hardware Supplies (120 kg)',
        returned_vehicle=False
    )

    m1 = Maintenance(
        vehicle_id=v1.id,
        service_date=now - timedelta(days=25),
        service_type='Oil & Filter',
        cost=3200,
        next_service_date=now + timedelta(days=65),
        notes='Routine service'
    )
    m2 = Maintenance(
        vehicle_id=v2.id,
        service_date=now - timedelta(days=105),
        service_type='Full Service',
        cost=8500,
        next_service_date=now,
        notes='Service overdue'
    )
    m3 = Maintenance(
        vehicle_id=v3.id,
        service_date=now - timedelta(days=45),
        service_type='Brake Inspection',
        cost=1800,
        next_service_date=now + timedelta(days=45)
    )

    db.session.add_all([t1, t2, t3, m1, m2, m3])
    db.session.commit()
    print("Python MySQL Database Seed Complete!")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_database()
