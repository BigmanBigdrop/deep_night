export type Invitation = {
  id: string
  token: string
  guest_name: string
  created_at: string
  expires_at: string
  is_used: boolean
  created_by: string | null
}

export type Ticket = {
  id: string
  invitation_id: string
  qr_code_slug: string
  user_id: string | null
  guest_first_name: string
  guest_last_name: string
  guest_age: number | null
  guest_email: string | null
  guest_phone: string | null
  guest_photo_url: string | null
  created_at: string
  updated_at: string | null
  has_completed_survey: boolean
  drink_beers: string[]
  drink_cans: string[]
  drink_spirits: string[]
  drink_wants_shots: boolean
  checked_in: boolean
  checked_in_at: string | null
}

export type Announcement = {
  id: string
  title: string
  content: string
  type: 'info' | 'location'
  is_published: boolean
  created_at: string
  updated_at: string | null
  created_by: string | null
}

export const DRINK_OPTIONS = {
  beers: ['Desperados', 'Codys Bleue', 'Heineken', 'Beaufort'],
  cans: ['Vody Noire', 'Vody Tropicale', 'Vody Mint'],
  spirits: ['Vodka Absolute', 'Whytehall Honey', 'Whytehall Chocolate'],
} as const

export type DrinkCategory = keyof typeof DRINK_OPTIONS

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }
