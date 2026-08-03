const testimonials = [
  {
    name: 'Sarah M.',
    quote: "Radiance completely changed my skincare routine. The AI analysis was spot-on and my skin has never looked better!",
    avatar: 'SM',
  },
  {
    name: 'James L.',
    quote: "I love the streak system — it keeps me motivated to stick with my routine every day. My skin score has gone up 20 points!",
    avatar: 'JL',
  },
  {
    name: 'Priya K.',
    quote: "The product scanner is a game changer. I finally know which products actually work for my skin type.",
    avatar: 'PK',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text">
            What Our Users Say
          </h2>
          <p className="mt-4 text-text-secondary text-lg">
            Join thousands who have transformed their skincare with Radiance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-8 rounded-2xl bg-glass-pink/50 border border-primary-light"
            >
              <p className="text-text leading-relaxed italic">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-white text-sm font-semibold flex items-center justify-center">
                  {t.avatar}
                </div>
                <span className="font-medium text-text">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
