/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F06680",
          light: "#FFE0E6",
          dark: "#D44D6A",
        },
        surface: {
          DEFAULT: "#F7F7FA",
          alt: "#F2F2F7",
        },
        skin: {
          text: "#1C1C1E",
          "text-secondary": "#8E8E93",
          "text-tertiary": "#AEAEB2",
          border: "#E5E5EA",
          "border-light": "#EAEAEF",
          dark: "#0D0D12",
        },
        success: "#34C759",
        warning: "#FF9500",
        error: "#FF3B30",
      },
      fontFamily: {
        sans: ["SFProRounded_Regular"],
        "sans-medium": ["SFProRounded_Medium"],
        "sans-semibold": ["SFProRounded_Semibold"],
        "sans-bold": ["SFProRounded_Bold"],
        // Aliases for existing font-poppins-* classNames
        poppins: ["SFProRounded_Regular"],
        "poppins-medium": ["SFProRounded_Medium"],
        "poppins-semibold": ["SFProRounded_Semibold"],
        "poppins-bold": ["SFProRounded_Bold"],
        "poppins-extrabold": ["SFProRounded_Bold"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "16px",
        xl: "24px",
        glass: "22px",
      },
    },
  },
  plugins: [],
};
