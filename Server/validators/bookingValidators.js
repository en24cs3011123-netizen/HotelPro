const { z } = require('zod');

const createBookingSchema = z.object({
  body: z
    .object({
      hotel: z.string().min(1, 'Hotel reference is required'),
      room: z.string().min(1, 'Room reference is required'),
      checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be in YYYY-MM-DD format'),
      checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be in YYYY-MM-DD format'),
      numberOfGuests: z.number().int().min(1, 'At least 1 guest required'),
      numberOfRooms: z.number().int().min(1).default(1),
      guestDetails: z.object({
        fullName: z.string().trim().min(2, 'Guest full name is required'),
        email: z.string().trim().email('Valid guest email is required'),
        phone: z.string().trim().min(10, 'Valid guest phone is required'),
        specialRequests: z.string().trim().optional()
      })
    })
    .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
      message: 'checkOut must be strictly after checkIn',
      path: ['checkOut']
    })
    .refine((data) => new Date(data.checkIn) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'checkIn date cannot be in the past',
      path: ['checkIn']
    })
});

const cancelBookingSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(3, 'Cancellation reason is required')
  })
});

const updateBookingStatusSchema = z.object({
  body: z.object({
    bookingStatus: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])
  })
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  updateBookingStatusSchema
};
