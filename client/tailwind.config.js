/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                midnight: {
                    900: '#0F172A', // Dark Midnight Blue
                    800: '#1E293B',
                },
                emerald: {
                    400: '#34D399',
                    500: '#10B981', // Vibrant Emerald
                    600: '#059669',
                },
                cool: {
                    gray: '#F8FAFC', // Soft Background
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
