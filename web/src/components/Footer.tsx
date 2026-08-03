const footerLinks = [
  {
    heading: 'Product',
    links: ['Features', 'Pricing', 'FAQ'],
  },
  {
    heading: 'Company',
    links: ['About', 'Blog', 'Careers'],
  },
  {
    heading: 'Legal',
    links: ['Privacy Policy', 'Terms of Use'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-dark-start text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold">Radiance</span>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              AI-powered skincare for everyone. Your skin, your journey.
            </p>
            {/* Social icons placeholder */}
            <div className="mt-6 flex gap-4">
              {['X', 'IG', 'TT'].map((s) => (
                <div
                  key={s}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} Radiance. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
