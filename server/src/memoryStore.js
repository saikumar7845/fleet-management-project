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
  ],

  hotels: [
    {
      _id: 'h1',
      id: 'h1',
      name: 'Grand Hyatt Executive Resort',
      city: 'Hyderabad',
      address: 'Gachibowli Financial District, Hyderabad',
      totalRooms: 120,
      availableRooms: 34,
      pricePerNight: 8500,
      rating: 4.8,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
    },
    {
      _id: 'h2',
      id: 'h2',
      name: 'The Oceanfront Bay Hotel',
      city: 'Visakhapatnam',
      address: 'Beach Road, RK Beach Promenade',
      totalRooms: 85,
      availableRooms: 18,
      pricePerNight: 6200,
      rating: 4.7,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
    },
    {
      _id: 'h3',
      id: 'h3',
      name: 'Royal Heritage Retreat',
      city: 'Vijayawada',
      address: 'MG Road, Opposite City Park',
      totalRooms: 60,
      availableRooms: 12,
      pricePerNight: 4900,
      rating: 4.5,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
    },
    {
      _id: 'h4',
      id: 'h4',
      name: 'Skyline Business Suites',
      city: 'Bengaluru',
      address: 'Indiranagar 100ft Road, Bengaluru',
      totalRooms: 150,
      availableRooms: 45,
      pricePerNight: 9200,
      rating: 4.9,
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
    },
    {
      _id: 'h5',
      id: 'h5',
      name: 'Serene River Valley Lodge',
      city: 'Rajahmundry',
      address: 'Godavari River Drive',
      totalRooms: 40,
      availableRooms: 0,
      pricePerNight: 3800,
      rating: 4.4,
      status: 'Renovation',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
    }
  ],

  bookings: [
    {
      _id: 'b1',
      id: 'b1',
      guestName: 'Anand Verma',
      guestEmail: 'anand@example.com',
      guestPhone: '9876543210',
      hotelId: 'h1',
      hotelName: 'Grand Hyatt Executive Resort',
      roomType: 'Deluxe Suite',
      checkIn: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      totalPrice: 34000,
      status: 'Checked-in'
    },
    {
      _id: 'b2',
      id: 'b2',
      guestName: 'Sunita Reddy',
      guestEmail: 'sunita@example.com',
      guestPhone: '9876501234',
      hotelId: 'h2',
      hotelName: 'The Oceanfront Bay Hotel',
      roomType: 'Ocean View Room',
      checkIn: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      totalPrice: 18600,
      status: 'Confirmed'
    }
  ],

  users: [
    {
      _id: 'u1',
      id: 'u1',
      name: 'Hotel Manager',
      email: 'manager@hotel.com',
      role: 'admin',
      phone: '9000000100'
    },
    {
      _id: 'u2',
      id: 'u2',
      name: 'Front Desk Agent',
      email: 'desk@hotel.com',
      role: 'staff',
      phone: '9000000101'
    }
  ]
};
