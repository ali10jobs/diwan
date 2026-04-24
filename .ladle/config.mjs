/** @type {import('@ladle/react').UserConfig} */
// Phase 2 DoD: "Ladle/Storybook shows all primitives across
// ar × en × bayan × alt × light × dark". The three dimensions live
// as global args (pickable in the toolbar); the Provider reads them
// and applies `lang`, `dir`, `data-brand`, `data-theme` to a wrapper
// element around every story.
const config = {
  stories: "stories/**/*.stories.{js,jsx,ts,tsx}",
  addons: {
    theme: { enabled: false },
    rtl: { enabled: false },
    i18n: { enabled: false },
    mode: { enabled: true },
    width: { enabled: false },
    control: { enabled: true },
  },
  defaultStory: "primitives--button",
};

export default config;
