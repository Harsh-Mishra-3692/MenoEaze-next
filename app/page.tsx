'use client'

import {
  Heart,
  ShieldCheck,
  Users,
  Lock,
  BarChart3,
  MessageCircle,
  Clock,
  Hospital
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'

/* ================= HERO TEXT ANIMATION ================= */

const sentence = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

const letter = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
}

/* ================= MAIN PAGE ================= */

export default function HomePage() {
  const heroText = "MenoEaze"

  return (
    <div className="overflow-hidden">

      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white text-center pt-32 pb-40 px-6 overflow-hidden">

        <AnimatedBackground />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex justify-center mb-6">
            <Heart className="w-16 h-16 drop-shadow-xl" />
          </div>

          {/* Animated Title */}
          <motion.h1
            variants={sentence}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            {heroText.split('').map((char, i) => (
              <motion.span key={i} variants={letter}>
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <p className="text-xl md:text-2xl font-medium mb-4">
            Your trusted companion for navigating menopause with confidence
          </p>

          <p className="text-lg opacity-90 mb-6">
            Track symptoms, gain insights, and connect with a supportive community
          </p>

          <div className="flex justify-center items-center gap-3 text-sm mb-10 opacity-90">
            <Lock className="w-4 h-4" />
            HIPAA Compliant • Privacy First • Trusted by 1,000+ Women
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth"
              className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              Get Started Free
            </Link>

            <Link
              href="/community"
              className="border border-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition"
            >
              Explore Community
            </Link>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 120" className="w-full">
            <path
              fill="#f9fafb"
              d="M0,64L80,64C160,64,320,64,480,80C640,96,800,128,960,122.7C1120,117,1280,75,1360,53.3L1440,32V120H0Z"
            />
          </svg>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-gray-50 py-28 px-6">
        <div className="max-w-7xl mx-auto text-center">

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your Complete Wellness Companion
          </h2>

          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-20">
            Everything you need to navigate your menopause journey with confidence and support
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <Reveal>
              <PremiumFeatureCard
                title="Symptom Tracking"
                description="Comprehensive daily tracking with detailed insights and pattern recognition."
                icon={<BarChart3 className="w-6 h-6 text-white" />}
                gradient="from-purple-500 to-pink-500"
                bg="bg-purple-50"
              />
            </Reveal>

            <Reveal>
              <PremiumFeatureCard
                title="Personalized AI Chat"
                description="Instant AI-powered guidance available 24/7."
                icon={<MessageCircle className="w-6 h-6 text-white" />}
                gradient="from-pink-500 to-rose-500"
                bg="bg-rose-50"
              />
            </Reveal>

            <Reveal>
              <PremiumFeatureCard
                title="Community Support"
                description="Connect with women sharing similar experiences."
                icon={<Users className="w-6 h-6 text-white" />}
                gradient="from-indigo-500 to-purple-500"
                bg="bg-indigo-50"
              />
            </Reveal>

            <Reveal>
              <PremiumFeatureCard
                title="Privacy First"
                description="Encrypted, HIPAA compliant and secure."
                icon={<ShieldCheck className="w-6 h-6 text-white" />}
                gradient="from-green-500 to-emerald-500"
                bg="bg-green-50"
              />
            </Reveal>

            <Reveal>
              <PremiumFeatureCard
                title="24/7 Access"
                description="Anytime access to dashboard and assistant."
                icon={<Clock className="w-6 h-6 text-white" />}
                gradient="from-blue-500 to-indigo-500"
                bg="bg-blue-50"
              />
            </Reveal>

            <Reveal>
              <PremiumFeatureCard
                title="Healthcare Integration"
                description="Share insights with your provider seamlessly."
                icon={<Hospital className="w-6 h-6 text-white" />}
                gradient="from-fuchsia-500 to-purple-500"
                bg="bg-fuchsia-50"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center py-28 px-6">
        <h2 className="text-4xl font-bold mb-6">
          Ready to take control?
        </h2>

        <p className="mb-8 text-lg opacity-90">
          Join thousands managing their menopause journey with confidence.
        </p>

        <Link
          href="/auth"
          className="bg-white text-purple-600 px-10 py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          Start Your Journey Today
        </Link>
      </section>
    </div>
  )
}

/* ================= ANIMATED BACKGROUND ================= */

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-purple-400/40 rounded-full blur-[120px] animate-float1 top-[-150px] left-[-150px]" />
      <div className="absolute w-[600px] h-[600px] bg-pink-400/40 rounded-full blur-[120px] animate-float2 bottom-[-150px] right-[-150px]" />
      <div className="absolute w-[600px] h-[600px] bg-rose-400/30 rounded-full blur-[120px] animate-float3 top-[40%] left-[40%]" />
    </div>
  )
}

/* Add these keyframes to globals.css:

@keyframes float1 {
  from { transform: translate(0,0); }
  to { transform: translate(80px,-60px); }
}
@keyframes float2 {
  from { transform: translate(0,0); }
  to { transform: translate(-60px,60px); }
}
@keyframes float3 {
  from { transform: translate(0,0); }
  to { transform: translate(40px,-40px); }
}

.animate-float1 { animation: float1 20s ease-in-out infinite alternate; }
.animate-float2 { animation: float2 25s ease-in-out infinite alternate; }
.animate-float3 { animation: float3 30s ease-in-out infinite alternate; }

*/

/* ================= FEATURE CARD ================= */

interface FeatureProps {
  title: string
  description: string
  icon: ReactNode
  gradient: string
  bg: string
}

function PremiumFeatureCard({
  title,
  description,
  icon,
  gradient,
  bg
}: FeatureProps) {
  return (
    <div className="group relative">

      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 blur transition duration-500`} />

      <div className={`${bg} relative rounded-2xl p-8 shadow-sm group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} mb-6`}>
          {icon}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>

        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

/* ================= SCROLL REVEAL ================= */

function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      {children}
    </div>
  )
}