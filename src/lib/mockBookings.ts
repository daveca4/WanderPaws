// Mock data for bookings/walks
export const mockBookings = [
  {
    id: '1',
    dogId: '1',
    walkerId: '1',
    date: '2023-08-20',
    time: '09:00',
    duration: 30,
    status: 'completed',
    location: {
      address: '123 Park Ave',
      city: 'London',
      postcode: 'SW1A 1AA'
    },
    notes: 'Bring treats!'
  },
  {
    id: '2',
    dogId: '2',
    walkerId: '1',
    date: '2023-08-21',
    time: '10:00',
    duration: 60,
    status: 'scheduled',
    location: {
      address: '456 Lake St',
      city: 'London',
      postcode: 'E1 6AN'
    },
    notes: 'Likes to chase squirrels'
  }
];

export default mockBookings; 