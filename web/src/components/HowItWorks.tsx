const steps = [
  {
    number: '1',
    title: 'Take the Quiz',
    description: 'Answer a few quick questions about your skin type, concerns, and goals.',
  },
  {
    number: '2',
    title: 'Get Your Analysis',
    description: 'Our AI generates a detailed skin score, face map, and personalized insights.',
  },
  {
    number: '3',
    title: 'Follow Your Routine',
    description: 'Receive custom AM/PM routines and track your progress as your skin transforms.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-glass-pink/40">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text">
            How It Works
          </h2>
          <p className="mt-4 text-text-secondary text-lg">
            Three simple steps to start your personalized skincare journey.
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-12 md:gap-0">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-gradient-start to-gradient-end" />

          {steps.map((step, i) => (
            <div key={step.number} className="flex-1 flex flex-col items-center text-center relative">
              {/* Vertical line segment (mobile) */}
              {i < steps.length - 1 && (
                <div className="md:hidden absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-gradient-start to-gradient-end" />
              )}
              <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-primary/20">
                {step.number}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-text">{step.title}</h3>
              <p className="mt-2 text-text-secondary text-sm max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
