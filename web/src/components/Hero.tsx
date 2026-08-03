import heroImg from '../assets/hero.png'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-glass-pink to-white">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row items-center gap-12">
        {/* Copy */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text leading-tight">
            Your AI-Powered{' '}
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              Skincare
            </span>{' '}
            Companion
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-lg mx-auto md:mx-0">
            Take a quick skin quiz, get a personalized analysis powered by AI, and follow tailored AM/PM routines to
            unlock your best skin.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="#cta"
              className="bg-gradient-to-r from-gradient-start to-gradient-end text-white font-semibold px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity text-center"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="border-2 border-primary text-primary font-semibold px-8 py-3.5 rounded-full hover:bg-primary-light transition-colors text-center"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero image */}
        <div className="flex-1 flex justify-center">
          <img
            src={heroImg}
            alt="Radiance app preview"
            className="w-full max-w-md drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-light rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-glass-purple rounded-full blur-3xl opacity-40 pointer-events-none" />
    </section>
  )
}
