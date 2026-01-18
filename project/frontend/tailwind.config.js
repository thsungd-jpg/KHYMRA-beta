/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Rajdhani', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                // Chimera specific colors
                chimera: {
                    dark: '#050505',
                    surface: '#0A0A0B',
                    'surface-highlight': '#18181B',
                    amber: '#F59E0B',
                    'amber-dim': 'rgba(245, 158, 11, 0.5)',
                    emerald: '#10B981',
                    text: '#FAFAFA',
                    'text-muted': '#A1A1AA',
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                'glow-amber': '0 0 30px -5px rgba(245, 158, 11, 0.15)',
                'glow-amber-md': '0 0 40px -5px rgba(245, 158, 11, 0.25)',
                'glow-amber-lg': '0 0 60px -5px rgba(245, 158, 11, 0.35)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' },
                    '50%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)' }
                },
                'orbit': {
                    from: { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
                    to: { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'orbit': 'orbit 20s linear infinite',
            },
            backgroundImage: {
                'nebula': 'radial-gradient(ellipse at 20% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(245, 158, 11, 0.03) 0%, transparent 70%)',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
