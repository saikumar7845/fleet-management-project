export const memoryData = {
  vehicles: [
    {
      _id: 'v1',
      id: 'v1',
      registrationNumber: 'AP39AB1234',
      type: 'Delivery Van',
      purchaseDate: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
      lastServiceDate: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      currentOdometer: 45200,
      status: 'assigned',
      assignedDriver: { _id: 'd1', id: 'd1', name: 'Ravi Kumar', email: 'driver@fleet.com', phone: '9000000002' },
      loadStatus: 'loaded',
      currentLoad: 'Electronics Cargo',
      loadWeightKg: 450
    },
    {
      _id: 'v2',
      id: 'v2',
      registrationNumber: 'AP40CD5678',
      type: 'Field Service Car',
      purchaseDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
      lastServiceDate: new Date(Date.now() - 105 * 86400000).toISOString().split('T')[0],
      currentOdometer: 38100,
      status: 'assigned',
      assignedDriver: { _id: 'd2', id: 'd2', name: 'Priya Sharma', email: 'priya@fleet.com', phone: '9000000003' },
      loadStatus: 'unloaded',
      currentLoad: 'Empty / Unloaded',
      loadWeightKg: 0
    },
    {
      _id: 'v3',
      id: 'v3',
      registrationNumber: 'AP41EF9012',
      type: 'Pickup Truck',
      purchaseDate: new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0],
      lastServiceDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
      currentOdometer: 67000,
      status: 'available',
      assignedDriver: null,
      loadStatus: 'unloaded',
      currentLoad: 'Empty / Unloaded',
      loadWeightKg: 0
    }
  ],

  drivers: [
    {
      _id: 'd1',
      id: 'd1',
      name: 'Ravi Kumar',
      email: 'driver@fleet.com',
      phone: '9000000002',
      role: 'driver',
      active: true,
      assignedVehicle: 'AP39AB1234'
    },
    {
      _id: 'd2',
      id: 'd2',
      name: 'Priya Sharma',
      email: 'priya@fleet.com',
      phone: '9000000003',
      role: 'driver',
      active: true,
      assignedVehicle: 'AP40CD5678'
    }
  ],

  trips: [
    {
      _id: 't1',
      id: 't1',
      driver: { _id: 'd1', name: 'Ravi Kumar' },
      vehicle: { _id: 'v1', registrationNumber: 'AP39AB1234' },
      startLocation: 'Vijayawada',
      endLocation: 'Guntur',
      distanceKm: 65,
      fuelUsedLitres: 8,
      startTime: new Date(Date.now() - 2 * 86400000).toISOString(),
      endTime: new Date(Date.now() - 2 * 86400000 + 7200000).toISOString()
    },
    {
      _id: 't2',
      id: 't2',
      driver: { _id: 'd1', name: 'Ravi Kumar' },
      vehicle: { _id: 'v1', registrationNumber: 'AP39AB1234' },
      startLocation: 'Guntur',
      endLocation: 'Tenali',
      distanceKm: 48,
      fuelUsedLitres: 6,
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() - 86400000 + 5400000).toISOString()
    },
    {
      _id: 't3',
      id: 't3',
      driver: { _id: 'd2', name: 'Priya Sharma' },
      vehicle: { _id: 'v2', registrationNumber: 'AP40CD5678' },
      startLocation: 'Visakhapatnam',
      endLocation: 'Anakapalle',
      distanceKm: 70,
      fuelUsedLitres: 7.5,
      startTime: new Date(Date.now() - 3 * 86400000).toISOString(),
      endTime: new Date(Date.now() - 3 * 86400000 + 7200000).toISOString()
    }
  ],

  maintenance: [
    {
      _id: 'm1',
      id: 'm1',
      vehicle: { _id: 'v1', registrationNumber: 'AP39AB1234' },
      serviceDate: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      serviceType: 'Oil & Filter',
      cost: 3200,
      notes: 'Routine service completed',
      nextServiceDate: new Date(Date.now() + 65 * 86400000).toISOString().split('T')[0]
    },
    {
      _id: 'm2',
      id: 'm2',
      vehicle: { _id: 'v2', registrationNumber: 'AP40CD5678' },
      serviceDate: new Date(Date.now() - 105 * 86400000).toISOString().split('T')[0],
      serviceType: 'Full Service',
      cost: 8500,
      notes: 'Service Overdue Alert',
      nextServiceDate: new Date().toISOString().split('T')[0]
    },
    {
      _id: 'm3',
      id: 'm3',
      vehicle: { _id: 'v3', registrationNumber: 'AP41EF9012' },
      serviceDate: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
      serviceType: 'Brake Inspection',
      cost: 1800,
      notes: 'Brake pads replaced',
      nextServiceDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0]
    }
  ]
};
