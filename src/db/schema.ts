import {
  pgTable,
  text,
  integer,
  serial,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// MULTI_TENANT: businesses table is the anchor for multi-tenancy.
// ─────────────────────────────────────────────────────────────────────────────
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  phoneNumberId: text("phone_number_id").notNull().unique(), // Kapso phone_number_id
  kapsoApiKey: text("kapso_api_key").notNull(),
  kapsoWebhookSecret: text("kapso_webhook_secret"),
  timezone: text("timezone").notNull().default("America/Chicago"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  // MULTI_TENANT: add → businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(), // manicure, pedicure, extras
  active: boolean("active").notNull().default(true),
  images: text("images").array().default([]),
  sortOrder: integer("sort_order").default(0),
});

// ─────────────────────────────────────────────────────────────────────────────
// STAFF — must be declared before bookings (bookings.staffId references staff)
// ─────────────────────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  googleCalendarId: text("google_calendar_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(), // UUID
  // MULTI_TENANT: add → businessId: integer("business_id").notNull().references(() => businesses.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  staffId: integer("staff_id").references(() => staff.id),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientEmail: text("client_email"),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(), // HH:mm
  // status: confirmed | cancelled | completed | awaiting_staff | awaiting_client
  status: text("status").notNull().default("confirmed"),
  notes: text("notes"),
  googleEventId: text("google_event_id"),
  confirmStaff: boolean("confirm_staff").notNull().default(false),
  confirmClient: boolean("confirm_client").notNull().default(false),
  confirmedStaffAt: timestamp("confirmed_staff_at", { withTimezone: true }),
  confirmedClientAt: timestamp("confirmed_client_at", { withTimezone: true }),
  cancelledBy: text("cancelled_by"), // staff | client | system | manager
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const blockedTimes = pgTable("blocked_times", {
  id: serial("id").primaryKey(),
  // MULTI_TENANT: add → businessId: integer("business_id").notNull().references(() => businesses.id),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(), // HH:mm
  reason: text("reason"),
});

export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 8-char uppercase
  amount: doublePrecision("amount").notNull(),
  balance: doublePrecision("balance").notNull(),
  purchaserName: text("purchaser_name").notNull(),
  purchaserEmail: text("purchaser_email"),
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  message: text("message"),
  status: text("status").notNull().default("active"), // active, used, expired
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: text("booking_id").references(() => bookings.id),
  clientName: text("client_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loyaltyPoints = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  clientPhone: text("client_phone").notNull().unique(),
  clientName: text("client_name").notNull(),
  points: integer("points").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp bot conversation sessions
// ─────────────────────────────────────────────────────────────────────────────
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  // MULTI_TENANT: add → businessId: integer("business_id").notNull().references(() => businesses.id),
  step: text("step").notNull().default("welcome"),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Identified WhatsApp users (via Google OAuth or WhatsApp OTP)
export const waUsers = pgTable("wa_users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  googleId: text("google_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILES — links Google accounts to WhatsApp phones + portal role
// ─────────────────────────────────────────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'admin' (superadmin from env only)
  whatsappPhone: text("whatsapp_phone").unique(),
  displayName: text("display_name"),
  handPhotoUrl: text("hand_photo_url"), // stored hand photo for try-on /uploads/hands/xxx.jpg
  linkedAt: timestamp("linked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Short-lived tokens linking a WA session to a Google OAuth flow
export const whatsappAuthTokens = pgTable("whatsapp_auth_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),          // 32-byte hex, URL-safe
  phone: text("phone").notNull(),
  sessionData: jsonb("session_data").$type<Record<string, unknown>>().notNull().default({}),
  googleEmail: text("google_email"),
  googleName: text("google_name"),
  googleId: text("google_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 30 min
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp deep-link verification tokens (web → WA button flow)
// ─────────────────────────────────────────────────────────────────────────────
export const whatsappLinkTokens = pgTable("whatsapp_link_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(), // 8-char hex, e.g. "A1B2C3D4"
  phone: text("phone"),                    // filled by bot when user sends the message
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 10 min
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// WhatsApp OTP codes for web booking phone verification
export const whatsappOtpCodes = pgTable("whatsapp_otp_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(), // 6-digit
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 10 min
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// STAFF SERVICES — which services each staff member can perform
// ─────────────────────────────────────────────────────────────────────────────
export const staffServices = pgTable(
  "staff_services",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    serviceId: integer("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    durationOverride: integer("duration_override"), // null = use service default
    priceOverride: doublePrecision("price_override"), // null = use service default
  },
  (t) => [primaryKey({ columns: [t.staffId, t.serviceId] })]
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULES — Cal.com pattern: named templates + recurring windows + exceptions
// ─────────────────────────────────────────────────────────────────────────────

// Named schedule templates (e.g. "Horario normal", "Horario verano")
export const staffSchedules = pgTable("staff_schedules", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Recurring weekly windows. specificDate non-null = one-time override for that date.
// daysOfWeek: [1,2,3,4,5] = Mon-Fri (JS convention: 0=Sun, 6=Sat)
export const scheduleAvailability = pgTable("schedule_availability", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id")
    .notNull()
    .references(() => staffSchedules.id, { onDelete: "cascade" }),
  daysOfWeek: integer("days_of_week").array(), // null if specificDate is set
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(), // HH:mm
  specificDate: text("specific_date"), // YYYY-MM-DD; null = recurring
});

// Date-specific exceptions: vacation, sick, custom hours, closed
export const scheduleExceptions = pgTable(
  "schedule_exceptions",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    type: text("type").notNull(), // VACATION | SICK | CUSTOM_HOURS | CLOSED
    customStart: text("custom_start"), // HH:mm, only for CUSTOM_HOURS
    customEnd: text("custom_end"),
    note: text("note"),
  },
  (t) => [unique().on(t.staffId, t.date)]
);

// Recurring or one-time blocks within working hours (lunch, admin time)
export const timeBlocks = pgTable("time_blocks", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  date: text("date"),             // YYYY-MM-DD; null = recurring
  daysOfWeek: integer("days_of_week").array(), // null if date is set
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(),     // HH:mm
  type: text("type").notNull().default("BREAK"), // LUNCH | BREAK | ADMIN | PERSONAL
  label: text("label"),
});

// ─────────────────────────────────────────────────────────────────────────────
// SLOT GROUPS — admin-defined time groupings shown in booking wizard
// ─────────────────────────────────────────────────────────────────────────────
export const slotGroups = pgTable("slot_groups", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id),
  name: text("name").notNull(),      // e.g. "Mañana", "Tarde", "Noche"
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(),     // HH:mm
  color: text("color"),  // hex color
  icon: text("icon"),    // emoji
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROLES — RBAC: super_admin > manager > staff
// ─────────────────────────────────────────────────────────────────────────────
export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" })
    .unique(),
  role: text("role").notNull(), // super_admin | manager | staff
  grantedBy: integer("granted_by").references(() => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// NAIL STYLES — catalog of nail designs for AI try-on
// ─────────────────────────────────────────────────────────────────────────────
export const nailStyles = pgTable("nail_styles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(), // french | gel | chrome | nail_art | minimal | bold | seasonal
  prompt: text("prompt").notNull(),     // Gemini image prompt for this design
  thumbnailUrl: text("thumbnail_url"),  // /uploads/nail-styles/xxx.jpg
  // Granular filter attributes (populated by classify-nail-styles.mjs or admin auto-classify)
  color: text("color"),        // nude | rosa | rojo | burdeos | blanco | negro | azul | verde | morado | lila | coral | multicolor | ...
  acabado: text("acabado"),    // glossy | matte | chrome | glitter | satinado
  forma: text("forma"),        // cuadrada | redonda | oval | almendra | stiletto | coffin
  estilo: text("estilo"),      // french | solid | floral | geometrico | glitter_foil | ombre | chrome | minimalista | nail_art
  // Promotional / visibility
  badge: text("badge"),        // null | "Nuevo" | "Promo" | "Temporada" | "Popular" | "Limitado"
  discountPercent: integer("discount_percent"), // null = no discount, 10 = 10% off
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  published: boolean("published").notNull().default(false),
});

// ─────────────────────────────────────────────────────────────────────────────
// NAIL STYLE VARIANTS — one row per (design × base pose) image
// ─────────────────────────────────────────────────────────────────────────────
export const nailStyleVariants = pgTable(
  "nail_style_variants",
  {
    id: serial("id").primaryKey(),
    styleId: integer("style_id")
      .notNull()
      .references(() => nailStyles.id, { onDelete: "cascade" }),
    baseId: text("base_id").notNull(), // garra | ascendente | doble | rocio
    imagePath: text("image_path").notNull(), // public/ relative path
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
    status: text("status").notNull().default("done"), // done | error
    errorMsg: text("error_msg"),
  },
  (t) => [unique().on(t.styleId, t.baseId)]
);

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG QUEUE — tracks source images that have been processed
// ─────────────────────────────────────────────────────────────────────────────
export const catalogQueue = pgTable("catalog_queue", {
  id: serial("id").primaryKey(),
  sourceImagePath: text("source_image_path").notNull(),
  sourceHash: text("source_hash").notNull().unique(), // sha256 hex of file content
  styleId: integer("style_id").references(() => nailStyles.id),
  status: text("status").notNull().default("queued"), // queued | processing | done | error
  errorMsg: text("error_msg"),
  queuedAt: timestamp("queued_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Booking requests — web flow: Google login → date/time → WhatsApp confirmation
// ─────────────────────────────────────────────────────────────────────────────
export const bookingRequests = pgTable("booking_requests", {
  id:          serial("id").primaryKey(),
  token:       text("token").notNull().unique(),
  googleId:    text("google_id").notNull(),
  email:       text("email").notNull(),
  name:        text("name").notNull(),
  styleId:     integer("style_id"),
  styleName:   text("style_name").notNull(),
  desiredDate: text("desired_date").notNull(),  // "2026-05-20"
  desiredTime: text("desired_time").notNull(),  // "10:00"
  notes:       text("notes"),
  phone:       text("phone"),                   // filled by bot when WA received
  status:      text("status").notNull().default("pending"), // pending | phone_linked
  expiresAt:   timestamp("expires_at",  { withTimezone: true }).notNull(),
  createdAt:   timestamp("created_at",  { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Site settings — simple key/value for toggling sections
// ─────────────────────────────────────────────────────────────────────────────
export const siteSettings = pgTable("site_settings", {
  key:   text("key").primaryKey(),
  value: text("value").notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type GiftCard = typeof giftCards.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type WaUser = typeof waUsers.$inferSelect;
export type WhatsappAuthToken = typeof whatsappAuthTokens.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
export type StaffSchedule = typeof staffSchedules.$inferSelect;
export type SlotGroup = typeof slotGroups.$inferSelect;
export type AdminRole = typeof adminRoles.$inferSelect;
export type WhatsappLinkToken = typeof whatsappLinkTokens.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
export type NailStyle = typeof nailStyles.$inferSelect;
export type NewNailStyle = typeof nailStyles.$inferInsert;
export type UserProfileWithHand = typeof userProfiles.$inferSelect;
export type NailStyleVariant = typeof nailStyleVariants.$inferSelect;
export type NewNailStyleVariant = typeof nailStyleVariants.$inferInsert;
export type CatalogQueueItem = typeof catalogQueue.$inferSelect;
export type NewCatalogQueueItem = typeof catalogQueue.$inferInsert;
