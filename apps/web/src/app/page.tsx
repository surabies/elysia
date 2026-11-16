import {
  BenefitsSection,
  FeatureSection,
  HeroSection,
  LiveTelemetryStrip,
  RadarWilayahSection,
  SimulasiTarifSection,
  TicketingSection,
  TopEventsSection,
} from '@/components/home'
import {
  benefitsContent,
  featureSections,
  heroContent,
  ticketingContent,
  topEventsContent,
} from '@/data/home'

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Section with Integrated Command Hub */}
      <HeroSection content={heroContent} />

      {/* 2. Real-time Operational Telemetry Pulse Strip */}
      <LiveTelemetryStrip />

      {/* 3. Interactive Regional Water Radar Preview (Pelayanan Wilayah 1-6 & Zonasi) */}
      <RadarWilayahSection />

      {/* 4. Featured Services Ribbon Carousel */}
      <TopEventsSection content={topEventsContent} />

      {/* 5. Interactive Tariff & Consumption Simulator */}
      <SimulasiTarifSection />

      {/* 6. Key Benefits Grid */}
      <TicketingSection content={ticketingContent} />

      {/* 7. Feature Deep-dives */}
      {featureSections.map((section) => (
        <FeatureSection key={section.id} section={section} />
      ))}
    </>
  )
}
