import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { PricingCard } from "@/components/pricing-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary mb-6 tracking-tight">
            Construction Management
            <br />
            That Gets Out of Your Way
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Organize projects in 1 hour, not 100
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-accent hover:bg-accent/90 text-primary font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-16">
            Start with a 14-day free trial. No credit card required.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Starter"
              price={49}
              description="Perfect for small builders"
              plan="STARTER"
              features={[
                "Up to 10 projects",
                "3 team members",
                "Basic reporting",
                "Email support",
                "Google Drive integration",
              ]}
            />
            <PricingCard
              name="Pro"
              price={99}
              description="For growing construction companies"
              plan="PRO"
              popular
              features={[
                "Unlimited projects",
                "Unlimited team members",
                "Advanced reporting & analytics",
                "Priority support",
                "Custom integrations",
                "AI-powered insights",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 BuildLight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
