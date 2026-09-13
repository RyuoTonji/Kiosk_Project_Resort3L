/**
 * ScreenRouter (View / Routing Layer)
 * Manages kiosk full-screen view transitions, active states, and hardware displays.
 */
export class ScreenRouter {
  /**
   * Initialize screen router with DOM elements.
   */
  constructor() {
    this.screens = {
      welcome: document.getElementById('screen-welcome'),
      dining: document.getElementById('screen-dining'),
      menu: document.getElementById('screen-menu'),
      confirmed: document.getElementById('screen-confirmed')
    };

    this.currentScreen = 'welcome';
  }

  /**
   * Transition view to target screen.
   * @param {'welcome' | 'dining' | 'menu' | 'confirmed'} screenName
   */
  navigate(screenName) {
    if (!this.screens[screenName]) {
      console.warn(`[ScreenRouter] Unknown screen target: "${screenName}"`);
      return;
    }

    Object.entries(this.screens).forEach(([name, el]) => {
      if (el) {
        if (name === screenName) {
          el.classList.remove('hidden');
          el.classList.add('active');
        } else {
          el.classList.add('hidden');
          el.classList.remove('active');
        }
      }
    });

    this.currentScreen = screenName;
  }

  /**
   * Get identifier of currently active screen.
   * @returns {'welcome' | 'dining' | 'menu' | 'confirmed'}
   */
  getCurrentScreen() {
    return this.currentScreen;
  }
}
