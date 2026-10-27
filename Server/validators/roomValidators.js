const { z } = require('zod');

const hotelCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Hotel name must be at least 2 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    address: z.string().trim().min(5, 'Address is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().optional(),
    country: z.string().trim().default('India'),
    contact: z
      .object({
        phone: z.string().trim().min(5),
        email: z.string().trim().email()
      })
      .optional(),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    policies: z
      .object({
        checkInTime: z.string().default('14:00'),
        checkOutTime: z.string().default('11:00'),
        cancellationPolicy: z.string().default('Free cancellation up to 48 hours before check-in')
      })
      .optional(),
    isActive: z.boolean().default(true)
  })
});

const hotelUpdateSchema = z.object({
  body: hotelCreateSchema.shape.body.partial()
});

const roomCreateSchema = z.object({
  body: z.object({
    hotel: z.string().min(1, 'Hotel reference is required'),
    roomNumber: z.string().trim().min(1, 'Room number is required'),
    roomType: z.enum(['single', 'double', 'deluxe', 'suite', 'family_villa', 'penthouse']),
    description: z.string().trim().min(5, 'Description is required'),
    capacity: z.number().int().min(1, 'Capacity must be at least 1 guest').max(10),
    pricePerNight: z.number().min(0, 'Price per night cannot be negative'),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    totalInventory: z.number().int().min(1).default(1),
    isActive: z.boolean().default(true)
  })
});

const roomUpdateSchema = z.object({
  body: roomCreateSchema.shape.body.partial()
});

const availabilityQuerySchema = z.object({
  query: z
    .object({
      hotelId: z.string().optional(),
      city: z.string().optional(),
      checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be in YYYY-MM-DD format'),
      checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be in YYYY-MM-DD format'),
      guests: z.coerce.number().int().min(1).default(1),
      roomType: z.string().optional()
    })
    .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
      message: 'checkOut date must be strictly after checkIn date',
      path: ['checkOut']
    })
});

module.exports = {
  hotelCreateSchema,
  hotelUpdateSchema,
  roomCreateSchema,
  roomUpdateSchema,
  availabilityQuerySchema
};
