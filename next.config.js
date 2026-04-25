// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Настройки Turbopack (если нужны)
    // root: __dirname, // если нужно указать корень проекта
  },
};

module.exports = withNextIntl(nextConfig);