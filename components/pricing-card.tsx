"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

interface PricingCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  plan: "STARTER" | "PRO";
  popular?: boolean;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  plan,
  popular = false,
}: PricingCardProps) {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!isSignedIn) {
      // Redirect to sign up
      window.location.href = "/sign-up";
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-card rounded-2xl p-8 hover:shadow-xl transition-shadow relative ${
        popular ? "border-2 border-accent" : "border border-border"
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-accent text-primary px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-primary mb-2">{name}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex items-baseline mb-2">
          <span className="text-5xl font-bold text-primary">${price}</span>
          <span className="text-muted-foreground ml-2">/month</span>
        </div>
        <p className="text-sm text-accent font-medium">14-day free trial</p>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-6 h-6 text-accent mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`block w-full text-center font-semibold px-6 py-3 rounded-lg transition-colors ${
          popular
            ? "bg-accent hover:bg-accent/90 text-primary"
            : "bg-primary hover:bg-primary/90 text-background"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? "Loading..." : "Start Free Trial"}
      </button>
    </div>
  );
}
