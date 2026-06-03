import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link href="/articles" className="inline-flex items-center gap-2 text-[#B8AA96]/50 text-xs tracking-wider uppercase hover:text-[#C6A15B] transition-colors mb-10">
          ← Back to Articles
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#C6A15B] text-xs tracking-wider">June 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
            <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">Robotics / Supply Chain</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            Who Builds the Actuator? Inside the Global Supply Chain of Every Robot Joint
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            A single robot joint depends on specialized components from at least five countries. No single nation — including China or the US — can produce a complete actuator from raw materials alone.
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Infographic */}
        <div className="mb-12">
          <div className="card-luxury p-4 md:p-6">
            <Image
              src="/images/articles/robot-actuator-supply-chain.jpg"
              alt="Who Builds the Actuator — Key supply chain dependencies inside every robot joint"
              width={1200}
              height={800}
              className="w-full h-auto rounded"
              priority
            />
            <p className="text-[#B8AA96]/50 text-xs mt-3 text-center italic">
              Source: Core Matter — Exploded view of a robot rotary actuator showing five critical component categories
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-[#B8AA96] text-base leading-relaxed font-light">

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">The Anatomy of a Robot Joint</h2>

          <p>
            Every humanoid robot, industrial arm, or collaborative robot relies on rotary actuators — the motors that drive each joint. Behind what looks like a single integrated component lies a complex global web of suppliers, each dominating a specialized niche.
          </p>

          <p>
            The infographic above, originally published by <strong className="text-[#F4EFE6]">Core Matter</strong>, breaks down the actuator into its five critical subcomponents and maps the key manufacturers behind each one.
          </p>

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Five Critical Components, Five Different Supply Chains</h2>

          <div className="space-y-6">

            <div className="card-luxury p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">1</div>
                <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Encoders</h3>
              </div>
              <p className="text-sm mb-3">
                The &quot;eyes&quot; of the motor — precision sensors that measure rotor position and speed. Without accurate feedback, the robot cannot control its movements.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Renishaw / RLS (UK)", "Heidenhain (Germany)", "Celera Motion (US)", "AMS OSRAM (Austria)"].map((m) => (
                  <span key={m} className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">{m}</span>
                ))}
              </div>
            </div>

            <div className="card-luxury p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold">2</div>
                <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Frameless BLDC Motors</h3>
              </div>
              <p className="text-sm mb-3">
                The core electromagnetic drive — stator and rotor without housing, designed to be integrated directly into the joint. High torque density is the competitive moat.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Kollmorgen (US)", "maxon (Switzerland)", "TQ-RoboDrive (Germany)", "CubeMars / Damiao / Robstride (China)", "MyActuator / Encos (China)"].map((m) => (
                  <span key={m} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">{m}</span>
                ))}
              </div>
            </div>

            <div className="card-luxury p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold">3</div>
                <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Rare-Earth Magnets</h3>
              </div>
              <p className="text-sm mb-3">
                The invisible force — neodymium magnets embedded in the rotor that create the magnetic field. This is where China holds the most leverage, controlling ~60% of global rare-earth processing.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Shin-Etsu / TDK (Japan)", "Vacuumschmelze (Germany)", "JL Mag / Zhongke Sanhuan (China)"].map((m) => (
                  <span key={m} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">{m}</span>
                ))}
              </div>
            </div>

            <div className="card-luxury p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-sm font-bold">4</div>
                <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Planetary Gears</h3>
              </div>
              <p className="text-sm mb-3">
                The torque multiplier — precision gearboxes that reduce motor speed while increasing output torque. German engineering dominates this segment, though Chinese firms are rapidly closing the gap.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Neugart (Germany)", "Wittenstein (Germany)", "Apex Dynamics (Taiwan)", "Newstart (China)"].map((m) => (
                  <span key={m} className="text-xs px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">{m}</span>
                ))}
              </div>
              <p className="text-xs text-[#B8AA96]/50 mt-3 italic">
                Note: Some robots use strain-wave (harmonic) or cycloidal drives instead of planetary gears.
              </p>
            </div>

            <div className="card-luxury p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-sm font-bold">5</div>
                <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Bearings</h3>
              </div>
              <p className="text-sm mb-3">
                The silent workhorse — precision bearings that allow smooth rotation under load. Japanese and European manufacturers dominate this century-old industry.
              </p>
              <div className="flex flex-wrap gap-2">
                {["NSK (Japan)", "NTN (Japan)", "SKF (Sweden)", "Schaeffler (Germany)"].map((m) => (
                  <span key={m} className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">{m}</span>
                ))}
              </div>
            </div>
          </div>

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Geographic Dominance Map</h2>

          <div className="card-luxury p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Germany</strong> — The largest concentration of actuator suppliers: encoders (Heidenhain), motors (TQ-RoboDrive), gears (Neugart, Wittenstein), magnets (Vacuumschmelze), bearings (Schaeffler). A single point of failure if supply is disrupted.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Japan</strong> — Dominates in magnets (Shin-Etsu, TDK) and bearings (NSK, NTN). Also strong in encoders via optical technology.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">China</strong> — Rapidly emerging across all categories. Already controls rare-earth magnet supply. Chinese motor and gear manufacturers (CubeMars, Newstart) are gaining market share through competitive pricing.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">US / UK / Switzerland / Sweden / Taiwan / Austria</strong> — Each provides specialized pieces. The US contributes motors (Kollmorgen) and encoders (Celera Motion), while Switzerland leads in precision motors (maxon).
              </div>
            </div>
          </div>

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Investment Implications</h2>

          <p>
            The robotics supply chain presents a unique investment opportunity: <strong className="text-[#F4EFE6]">picks-and-shovels plays</strong> benefit regardless of which robot OEM wins the humanoid race.
          </p>

          <div className="card-luxury p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Component suppliers have pricing power</strong> — Encoders, precision gears, and rare-earth magnets are bottleneck components with few alternatives. Suppliers can pass through cost increases.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">China rare-earth dominance is a geopolitical risk</strong> — Any export restriction on neodymium magnets would paralyze global robot production. Investors should monitor PBoC rare-earth policy closely.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">German Mittelstand is undervalued</strong> — Many actuator component suppliers are mid-cap German firms (Neugart, Wittenstein, Vacuumschmelze) not yet pricing in the humanoid robot demand wave.
              </div>
            </div>
          </div>

          <div className="card-luxury p-6 border-l-4 border-l-[#C6A15B]">
            <p className="text-sm italic text-[#B8AA96]/80">
              Disclaimer: Artikel ini bersifat informatif dan bukan merupakan rekomendasi investasi. Selalu lakukan riset mandiri sebelum mengambil keputusan investasi.
            </p>
          </div>
        </div>

        <div className="gold-line w-full mt-12 mb-8" />

        <Link href="/articles" className="inline-flex items-center gap-2 text-[#C6A15B] text-xs tracking-[0.2em] uppercase hover:text-[#D4B76A] transition-colors">
          ← Back to Articles
        </Link>
      </article>
    </div>
  );
}
