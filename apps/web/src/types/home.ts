export interface ImageAsset {
  src: string
  alt: string
}

export interface CtaLink {
  label: string
  href: string
}

export interface HeroContent {
  title: string
  description: string
  videoSrc: string
  poster?: string
  cta: CtaLink
}

export interface TicketEvent {
  id: string
  title: string
  venue: string
  city: string
  date: string
  price: string
  accentColor: string
}

export interface TopEventsContent {
  title: string
  description: string
  cta: CtaLink
  events: TicketEvent[]
}

export interface TicketingItem {
  title?: string
  badge?: string
  description: string
  href?: string
  ctaLabel?: string
  image?: ImageAsset
}

export interface TicketingContent {
  title: string
  subtitle?: string
  items: TicketingItem[]
}

export interface BenefitItem {
  title: string
  description?: string
  metric?: string
  icon: ImageAsset
  image?: ImageAsset
}

export interface BenefitsContent {
  title: string
  subtitle?: string
  items: BenefitItem[]
}

export type FeatureMedia =
  | { type: "image"; src: string; alt: string; width: number; height: number }
  | { type: "video"; src: string }
  | { type: "mockup"; name: "lapor-meter" | "pengaduan" }

export interface FeatureSectionContent {
  id: string
  badge?: string
  title: string
  description: string
  highlights?: string[]
  stats?: { label: string; value: string }[]
  media: FeatureMedia
  mediaPosition: "left" | "right"
  cta?: CtaLink
}

export interface LandingSectionsCMS {
  ticketing: TicketingContent
  benefits: BenefitsContent
  features: FeatureSectionContent[]
}
