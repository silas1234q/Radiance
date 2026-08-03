export default function CTA() {
  return (
    <section id="cta" className="py-20 md:py-28 bg-gradient-to-r from-gradient-start to-gradient-end relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Start Your Skin Journey Today
        </h2>
        <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
          Download Radiance and discover your personalized skincare routine in minutes.
        </p>
        <a
          href="#"
          className="mt-8 inline-block bg-white text-primary font-semibold px-10 py-4 rounded-full hover:bg-white/90 transition-colors shadow-lg"
        >
          Download the App
        </a>
      </div>
    </section>
  )
}
