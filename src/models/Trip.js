const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null,
  },
  // ─── Journey Basics ─────────────────────────────────────
  origin: {
    city: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  island: {
    id: { type: mongoose.Schema.ObjectId, ref: 'Island' },
    name: { type: String, required: true },
    group: String,
  },
  dates: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  travelers: {
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 },
  },

  // ─── User Selections (Mixed to accept flexible AI/frontend data) ────
  selectedTransport: { type: mongoose.Schema.Types.Mixed, default: {} },
  selectedAccommodation: { type: mongoose.Schema.Types.Mixed, default: {} },
  selectedActivities: { type: [mongoose.Schema.Types.Mixed], default: [] },
  foodPlan: {
    breakfastNeeded: { type: Boolean, default: true },
    lunchNeeded: { type: Boolean, default: true },
    dinnerNeeded: { type: Boolean, default: true },
    estimatedDailyCost: Number,
    totalCost: Number,
  },

  // ─── Budget Summary ────────────────────────────────────
  budget: {
    transport: Number,
    accommodation: Number,
    food: Number,
    activities: Number,
    miscellaneous: Number,
    total: Number,
    perPerson: Number,
  },

  // ─── AI Generated Content ──────────────────────────────
  aiItinerary: {
    dayPlan: mongoose.Schema.Types.Mixed,   // Array of day-by-day plan
    suggestions: mongoose.Schema.Types.Mixed, // Cultural, food, hidden gems
    rawMarkdown: String,                      // Full markdown output
  },

  status: {
    type: String,
    enum: ['draft', 'completed', 'saved'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

TripSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', TripSchema);
