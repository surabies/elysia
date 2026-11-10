import {
  BenefitsSection,
  FeatureSection,
  HeroSection,
  TicketingSection,
  TopEventsSection,
} from "@/components/home"
import {
  benefitsContent,
  featureSections,
  heroContent,
  ticketingContent,
  topEventsContent,
} from "@/data/home"

export default function HomePage() {
  return (
    <>
      <HeroSection content={heroContent} />
      <TopEventsSection content={topEventsContent} />
      <TicketingSection content={ticketingContent} />
      <BenefitsSection content={benefitsContent} />
      {featureSections.map((section) => (
        <FeatureSection key={section.id} section={section} />
      ))}
    </>
  )
}
