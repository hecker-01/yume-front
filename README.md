# Yume Ramen - Front-end

A modern, mobile-first Japanese ramen restaurant ordering interface with Kyoto-inspired aesthetic.

**Tech Stack:** Vue 3 | Tailwind CSS | Vite | Font Awesome

## Design Philosophy

Yume Ramen embodies the elegance and minimalism of traditional Japanese design, drawing inspiration from Kyoto's timeless aesthetic. The interface features:

- **Washi Paper Background** - Soft off-white (#f9f7f2) reminiscent of traditional Japanese paper
- **Torii Gate Red** - Bold accent color (#c0392b) for primary actions and active states
- **Matcha Green** - Subtle success indicators reflecting Japanese tea culture
- **Sumi Ink Typography** - Clean, readable text in traditional Japanese ink color
- **Japanese Fonts** - Noto Serif JP for headings, Zen Kaku Gothic New for body text

## Navigation

The app features a responsive navigation system:

- **Mobile** (< 768px): Fixed bottom bar with icon-first design, centered larger Home icon
- **Desktop** (≥ 768px): Modern floating bottom bar with rounded corners, subtle shadow, and icon+text layout

Navigation includes three main sections:

- **Home** - Browse menu and featured dishes
- **Orders** - View and track your orders
- **Account** - Manage profile and preferences

## Setup

```bash
git clone https://github.com/hecker-01/yume-front
cd yume-front
npm install
npm run dev
```

Live at [https://portfolio.heckerdev.net](https://portfolio.heckerdev.net)

## Project Structure

```
src/
├── components/     # Reusable Vue components
├── pages/          # Route-based page components
├── router/         # Vue Router configuration
├── services/       # API service layer
└── assets/         # Styles and static assets
```
