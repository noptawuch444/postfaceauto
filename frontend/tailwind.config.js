/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                'gs-gold': '#c9a84c',
                'gs-gold-light': '#e2c97e',
                'gs-gold-dark': '#8a6820',
                'gs-bg': '#08080c',
                'gs-sec': '#111116',
            },
            fontFamily: {
                prompt: ['Prompt', 'sans-serif'],
            },
            screens: {
                'xs': '480px',
            }
        },
    },
    plugins: [],
}
