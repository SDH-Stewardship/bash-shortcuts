#!/usr/bin/env python
import json
import os
from genericpath import exists
import sys
from copy import deepcopy

sys.path.append(os.path.dirname(__file__))

from instaceManager import InstanceManager
from settings import SettingsManager
from logger import log

Initialized = False

class Plugin:
  pluginUser = os.environ["DECKY_USER"]
  pluginSettingsDir = os.environ["DECKY_PLUGIN_SETTINGS_DIR"]
  
  oldShortcutsPath = f"/home/{pluginUser}/.config/bash-shortcuts/shortcuts.json"

  shortcutsRunnerPath = f"\"/home/{pluginUser}/homebrew/plugins/bash-shortcuts/shortcutsRunner.sh\""

  instanceManager = InstanceManager(250)
  settingsManager = SettingsManager(name='bash-shortcuts', settings_directory=os.path.join(pluginSettingsDir, "settings", "bash-shortcuts"))

  # Normal methods: can be called from JavaScript using call_plugin_function("signature", argument)
  async def getShortcuts(self):
    return self.settingsManager.settings.shortcuts
      
  async def addShortcut(self, shortcut):
    self._addShortcut(self, shortcut)
    return self.settingsManager.settings.shortcuts

  async def setShortcuts(self, shortcuts):
    self._setShortcuts(self, shortcuts)
    return self.settingsManager.settings.shortcuts

  async def modShortcut(self, shortcut):
    self._modShortcut(self, shortcut)
    return self.settingsManager.settings.shortcuts

  async def remShortcut(self, shortcut):
    self._remShortcut(self, shortcut)
    return self.settingsManager.settings.shortcuts

  async def runNonAppShortcut(self, shortcutId):
    self._runNonAppShortcut(self, shortcutId)

  async def killNonAppShortcut(self, shortcutId):
    self._killNonAppShortcut(self, shortcutId)

  async def getHomeDir(self):
    return self.pluginUser

  async def logMessage(self, message):
    log(message)

  # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
  async def _main(self):
    global Initialized
    if Initialized:
      return
    
    Initialized = True

    log("Initializing Shorcuts Plugin")

    self.settingsManager.read()
    
    if "shortcuts" not in self.settingsManager.settings:
      if (os.path.exists(self.oldShortcutsPath)):
        try:
          with open(self.oldShortcutsPath, "r") as file:
            shortcutsDict = json.load(file)
            self.settingsManager.setSetting("shortcuts", shortcutsDict)
            
        except Exception as e:
          log(f"Exception while parsing shortcuts: {e}") # error reading json
      else:
        self.settingsManager.setSetting("shortcuts", { "fcba1cb4-4601-45d8-b919-515d152c56ef": { "id": "fcba1cb4-4601-45d8-b919-515d152c56ef", "name": "Konsole", "cmd": "konsole", "position": 1, "isApp": True } })

    self.instanceManager.listenForThreadEvents()

    pass

  async def _unload(self):
    log("Plugin unloaded")
    pass

  def _addShortcut(self, shortcut):
    if (shortcut["id"] not in self.shortcuts):
      log(f"Adding shortcut {shortcut['name']}")
      self.settingsManager.settings.shortcuts[shortcut["id"]] = shortcut
      self.settingsManager.commit()
    else:
      log(f"Shortcut {shortcut['name']} already exists")

    pass

  def _setShortcuts(self, shortcuts):
    log(f"Setting shortcuts...")
    self.settingsManager.setSetting("shortcuts", shortcuts)

    pass

  def _modShortcut(self, shortcut):
    if (shortcut["id"] in self.shortcuts):
      log(f"Modifying shortcut {shortcut['name']}")
      self.settingsManager.settings.shortcuts[shortcut["id"]] = shortcut
      self.settingsManager.commit()
    else:
      log(f"Shortcut {shortcut['name']} does not exist")

    pass

  def _remShortcut(self, shortcut):
    if (shortcut["id"] in self.shortcuts):
      log(f"Removing shortcut {shortcut['name']}")
      del self.settingsManager.settings.shortcuts[shortcut["id"]]
      self.settingsManager.commit()
    else:
      log(f"Shortcut {shortcut['name']} does not exist")

    pass

  def _runNonAppShortcut(self, shortcutId):
    self.instanceManager.createInstance(self.settingsManager.settings.shortcuts[shortcutId])
  
  def _killNonAppShortcut(self, shortcutId):
    self.instanceManager.killInstance(self.settingsManager.settings.shortcuts[shortcutId])

