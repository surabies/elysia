import {
  BenefitsSection,
  DokumentasiKegiatanSection,
  FeatureSection,
  HeroSection,
  PromoBannerSpotlight,
  SimulasiTarifSection,
  TicketingSection,
  TopEventsSection,
} from '@/components/home'
import { ScrollProgressBar } from '@/components/shared/ScrollProgressBar'
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
      {/* 0. Top Scroll Progress Indicator */}
      <ScrollProgressBar />

      {/* 1. Hero Section with Integrated Command Hub */}
      <HeroSection content={heroContent} />

      {/* 2. Featured Promo / Iklan Spotlight Banner (Gebyar Sambungan Baru & Event PDAM) */}
      <PromoBannerSpotlight />

      {/* 3. Featured Services Ribbon Carousel */}
      <TopEventsSection content={topEventsContent} />

      {/* 4. Dokumentasi Kegiatan Pelayanan Wilayah 5 Dinamis */}
      <DokumentasiKegiatanSection />

      {/* 5. Interactive Tariff & Consumption Simulator */}
      <SimulasiTarifSection />

      {/* 5. Key Benefits Grid */}
      <TicketingSection content={ticketingContent} />

      {/* 6. Mengapa Layanan Digital Tirtawening? */}
      <BenefitsSection content={benefitsContent} />

      {/* 7. Feature Deep-dives */}
      {featureSections.map((section) => (
        <FeatureSection key={section.id} section={section} />
      ))}
    </>
  )
}
