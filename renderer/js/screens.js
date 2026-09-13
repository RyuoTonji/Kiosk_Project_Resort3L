/**
 * 3L's Beach Resort — Screen Transition Controller
 * Fast, immediate screen switching with zero layout reflow.
 */

const SCREEN_ELEMENT_IDS = {
  welcome: 'screen-welcome',
  'service-option': 'screen-service-option',
  catalog: 'screen-catalog',
  confirmed: 'screen-confirmed'
};

export function switchScreen(targetScreenName) {
  const targetId = SCREEN_ELEMENT_IDS[targetScreenName];
  if (!targetId) {
    console.warn(`[Screens] Unknown screen: ${targetScreenName}`);
    return;
  }

  Object.entries(SCREEN_ELEMENT_IDS).forEach(([name, id]) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (name === targetScreenName) {
      el.classList.remove('hidden-screen');
      el.classList.add('active-screen');
    } else {
      el.classList.remove('active-screen');
      el.classList.add('hidden-screen');
    }
  });
}
