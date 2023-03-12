import { PyInterop } from "../../PyInterop";
import { Shortcut } from "../data-structures/Shortcut";
import { SteamController } from "./SteamController";

/**
 * Enum for the different hook events.
 */
export enum Hook {
  LOG_IN = "Log In",
  LOG_OUT = "Log Out",
  GAME_START = "Game Start",
  GAME_END = "Game End",
  GAME_INSTALL = "Game Install",
  GAME_UNINSTALL = "Game Uninstall",
  GAME_ACHIEVEMENT_UNLOCKED = "Game Achievement Unlocked",
  SCREENSHOT_TAKEN = "Screenshot Taken",
  MESSAGE_RECIEVED = "Message Recieved",
  STEAMOS_UPDATE_AVAILABLE = 'SteamOS Update Available',
  DECK_SHUTDOWN = "Deck Shutdown",
  DECK_SLEEP = "Deck Sleep"
}

export const hookAsOptions = Object.values(Hook).map((entry) => { return { label: entry, data: entry } });

type hooks = {
  [key in Hook]: {
    [id: string]: Unregisterer
  }
}

/**
 * Controller for handling hook events.
 */
export class HookController {
  private steamController: SteamController;
  hooks: hooks = Object.assign({}, ...Object.values(Hook).map((hook) => [hook, {}]));

  /**
   * Creates a new HooksController.
   * @param steamController The SteamController to use.
   */
  constructor(steamController: SteamController) {
    this.steamController = steamController;
  }

  /**
   * Initializes the hooks for all shortcuts.
   * @param shortcuts The shortcuts to initialize the hooks of.
   */
  init(shortcuts: ShortcutsDictionary): void {
    for (const shortcut of Object.values(shortcuts)) {
      this.updateHooks(shortcut);
    }
  }

  /**
   * Updates the hooks for a shortcut.
   * @param shortcut The shortcut to update the hooks of.
   */
  updateHooks(shortcut: Shortcut) {
    const shortcutHooks = shortcut.hooks;

    for (const h of Object.keys(this.hooks)) {
      const hook = h as Hook;
      const registeredHooks = this.hooks[hook];

      if (shortcutHooks.includes(hook)) {
        this.registerHook(shortcut, hook);
      } else if (Object.keys(registeredHooks).includes(shortcut.id)) {
        this.unregisterHook(shortcut, hook);
      }
    }
  }

  /**
   * Registers a hook for a shortcut.
   * @param shortcut The shortcut to register the hook for.
   * @param hook The hook to register.
   */
  private registerHook(shortcut: Shortcut, hook: Hook): void {
    let unregister: Unregisterer;

    switch (hook) {
      case Hook.LOG_IN:
        unregister = this.steamController.registerForAuthStateChange(async (username: string) => {
          //TODO: Launch shortcut here
        }, null, false);
        break;
      case Hook.LOG_OUT:
        unregister = this.steamController.registerForAuthStateChange(null, async (username: string) => {
          //TODO: Launch shortcut here
        }, false);
        break;
      case Hook.GAME_START:
        unregister = this.steamController.registerForAllAppLifetimeNotifications((appId: number, data: LifetimeNotification) => {
          if (data.bRunning) {
            //TODO: Launch shortcut here
          }
        });
        break;
      case Hook.GAME_END:
        unregister = this.steamController.registerForAllAppLifetimeNotifications((appId: number, data: LifetimeNotification) => {
          if (!data.bRunning) {
            //TODO: Launch shortcut here
          }
        });
        break;
      case Hook.GAME_INSTALL:
        unregister = { unregister: () => {} };
        break;
      case Hook.GAME_UNINSTALL:
        unregister = { unregister: () => {} };
        break;
      case Hook.GAME_ACHIEVEMENT_UNLOCKED:
        unregister = { unregister: () => {} };
        break;
      case Hook.SCREENSHOT_TAKEN:
        unregister = { unregister: () => {} };
        break;
      case Hook.MESSAGE_RECIEVED:
        unregister = { unregister: () => {} };
        break;
      case Hook.STEAMOS_UPDATE_AVAILABLE:
        unregister = { unregister: () => {} };
        break;
      case Hook.DECK_SLEEP:
        unregister = { unregister: () => {} };
        break;
      case Hook.DECK_SHUTDOWN:
        unregister = { unregister: () => {} };
        break;
      default:
        PyInterop.log(`Unrecognized hook ${hook}`);
        return;                                                                                   
    }

    this.hooks[hook][shortcut.id] = unregister;
  }

  /**
   * Unregisters all hooks for a given shortcut.
   * @param shortcut The shortcut to unregister the hooks from.
   */
  unregisterAllHooks(shortcut: Shortcut) {
    const shortcutHooks = shortcut.hooks;

    for (const hook of shortcutHooks) {
      this.unregisterHook(shortcut, hook);
    }
  }

  /**
   * Unregisters a registered hook for a shortcut.
   * @param shortcut The shortcut to remove the hook from.
   * @param hook The hook to remove.
   */
  private unregisterHook(shortcut: Shortcut, hook: Hook): void {
    const registeredHooks = this.hooks[hook];

    if (Object.keys(registeredHooks).includes(shortcut.id)) {
      const { unregister } = registeredHooks[shortcut.id];
      unregister();
      PyInterop.log(`Removed hook for shortcut. Hook: ${hook} ShortcutID: ${shortcut.id} ShortcutName: ${shortcut.name}`);
    } else {
      PyInterop.log(`Could not find hook for shortcut. Hook: ${hook} ShortcutID: ${shortcut.id} ShortcutName: ${shortcut.name}`);
    }
  }

  /**
   * Dismounts the HooksController.
   */
  dismount(): void {
    for (const hook of Object.values(this.hooks)) {
      for (const shortcutId of Object.keys(hook)) {
        const { unregister } = hook[shortcutId];
        unregister();
        PyInterop.log(`Unregistered hook: ${hook} for shortcut with id: ${shortcutId}`);
      }
    }
  }
}