<div align="center">

# 🧠 MentalMap

**A premium, high-performance mind mapping tool for modern workflows.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js&logoColor=white)](https://d3js.org/)

[Features](#-features) • [Installation](#-getting-started) • [Shortcuts](#-keyboard-shortcuts) • [Deployment](#-deployment)

---

</div>

## 🌟 Overview

**MentalMap** is a sophisticated mind mapping application designed for clarity, speed, and aesthetic excellence. Whether you're brainstorming a new project, mapping out complex logic, or presenting ideas to a team, MentalMap provides a seamless, "glassmorphic" interface that keeps you in the flow.

## ✨ Features

- **☁️ Real-Time Cloud Sync**: Secure Google Authentication and database persistence powered by Supabase.
- **💾 1MB Storage Limit**: Per-user storage limits with a visual usage indicator to keep maps lean and efficient.
- **🎨 Professional Themes**: Switch between `Modern`, `Midnight`, and `Professional` themes to match your work environment.
- **🔳 Dynamic Backgrounds**: Customize your canvas with `Dotted`, `Grid`, or `None` background styles.
- **🖼️ Rich Media Support**: Attach images directly to nodes to visualize your concepts.
- **🔗 Flexible Relationships**: Create custom connections between any nodes, regardless of the tree structure.
- **📝 Contextual Notes**: Add detailed notes to any node for deeper documentation.
- **🔄 Smart History**: Full version control with a 50-step undo/redo buffer and detailed action logs.
- **🎭 Presenter Mode**: A distraction-free mode focused on showcasing your ideas with sleek animations.
- **📥 Import/Export**: Export your maps as JSON, Image, or PDF. Import existing JSON files to continue your work anytime.
- **🔍 Global Search**: Quickly find and navigate to any node in your map using `Ctrl + K`.

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript
- **Bundler**: Vite
- **Visualization**: D3.js (for layout and physics)
- **Styling**: Tailwind CSS (Lucide React for icons) - *Note: Tailwind is loaded via CDN in index.html*
- **Utilities**: UUID, HTML-to-Image, jsPDF

## 🚀 Getting Started

Follow these steps to get the project running locally on your system. For a detailed guide on setting up authentication and cloud storage, see the [SETUP_GUIDE.md](./SETUP_GUIDE.md).

### Prerequisites

- [Node.js](https://nodejs.org/) (Recommended version: 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/josevschmidt/mentalmap.git
   cd mentalmap
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## ⌨️ Keyboard Shortcuts

MentalMap is built for speed. Master these shortcuts to work without touching your mouse:

| Shortcut | Action |
| :--- | :--- |
| **Tab** | Add a new child node |
| **Enter** | Add a new sibling node |
| **Shift + Tab** | Navigate to parent node |
| **F2 / Double Click** | Edit selected node |
| **Delete / Backspace** | Delete selected node(s) |
| **Space** | Toggle collapse/expand node |
| **Ctrl + K** | Open global search |
| **Ctrl + Z** | Undo (Accessible via History Panel) |
| **F** | Toggle Focus Mode |

## 🌐 Deployment

MentalMap can be deployed as a static site to any modern web server.

### Build Project
```bash
npm run build
```
This will generate a `dist` folder containing the optimized production build.

### Vercel / Netlify / GitHub Pages
Simply connect your repository and set the following build settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/josevschmidt">@josevschmidt</a>
</div>
