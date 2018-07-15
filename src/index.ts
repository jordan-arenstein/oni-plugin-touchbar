import { remote } from "electron"
const { TouchBar, nativeImage } = remote
const { TouchBarButton, TouchBarLabel, TouchBarSpacer } = TouchBar
import * as Oni from "oni-api"
import * as path from "path"

type TouchBarActions =
  | "sidebar"
  | "interaction"
  | "debug"
  | { label: string; command: string; type: "nvim" | "oni" }[]

interface TouchBarConfiguration {
  enabled: boolean
  escapeItem: "bigger" | "close" | "browser"
  leftActions: TouchBarActions
  middleActions: TouchBarActions
  rightActions: TouchBarActions
}

const namedImage = (name: string): Electron.nativeImage => {
  const image: Electron.nativeImage = nativeImage.createFromNamedImage(
    `NSTouchBar${name}Template`,
    null
  )
  image.setTemplateImage(true)
  return image
}

const localImage = (name: string): Electron.nativeImage => {
  const image: Electron.nativeImage = nativeImage.createFromPath(
    path.join(__dirname, "..", `icons/${name}.png`)
  )
  image.setTemplateImage(true)
  return image
}

const icons = {
  browser: namedImage("OpenInBrowser"),
  browserBack: namedImage("GoBack"),
  browserForward: namedImage("GoForward"),
  close: localImage("Close"),
  debug: localImage("Debug"),
  definition: localImage("Definition"),
  explorer: localImage("Explorer"),
  format: localImage("Format"),
  learn: localImage("Learn"),
  marks: localImage("Marks"),
  plugins: localImage("Plugins"),
  recordStart: namedImage("RecordStart"),
  recordStop: namedImage("RecordStop"),
  reload: namedImage("Refresh"),
  rename: localImage("Rename"),
  search: namedImage("Search"),
  sidebar: namedImage("Sidebar"),
}

export const activate = (oni: Oni.Plugin.Api) => {
  const biggerEscButton = new TouchBarButton({
    label: "escape",
    click: () => oni.editors.activeEditor.neovim.input("<esc>"),
  })

  const closeButton = new TouchBarButton({
    icon: icons.close,
    click: () => oni.editors.activeEditor.neovim.command("wq"),
  })

  // sidebar commands
  const sidebarButton = new TouchBarButton({
    icon: icons.sidebar,
    click: () => oni.commands.executeCommand("sidebar.toggle"),
  })

  const explorerButton = new TouchBarButton({
    icon: icons.explorer,
    click: () => oni.commands.executeCommand("explorer.toggle"),
  })

  const searchButton = new TouchBarButton({
    icon: icons.search,
    click: () => oni.commands.executeCommand("search.searchAllFiles"),
  })

  // browser commands
  const browserButton = new TouchBarButton({
    icon: icons.browser,
    click: () => oni.commands.executeCommand("browser.openUrl"),
  })

  const browserBackButton = new TouchBarButton({
    icon: icons.browserBack,
    click: () => oni.commands.executeCommand("browser.goBack"),
  })

  const browserForwardButton = new TouchBarButton({
    icon: icons.browserForward,
    click: () => oni.commands.executeCommand("browser.goForward"),
  })

  const browserDeveloperToolsButton = new TouchBarButton({
    icon: icons.debug,
    click: () => oni.commands.executeCommand("browser.debug"),
  })

  // language commands
  const renameButton = new TouchBarButton({
    icon: icons.rename,
    click: () => oni.commands.executeCommand("editor.rename"),
  })

  const definitionButton = new TouchBarButton({
    icon: icons.definition,
    click: () => oni.commands.executeCommand("language.gotoDefinition"),
  })

  const formatButton = new TouchBarButton({
    icon: icons.format,
    click: () => oni.commands.executeCommand("language.format"),
  })

  const prettierButton = new TouchBarButton({
    icon: icons.format,
    click: () => oni.commands.executeCommand("autoformat.prettier"),
  })

  // debugging commands
  const toggleRecording = () => {
    if (oni.recorder.isRecording) {
      oni.commands.executeCommand("keyDisplayer.hide")
      oni.recorder.stopRecording()
      recordButton.icon = icons.recordStart
    } else {
      oni.commands.executeCommand("keyDisplayer.show")
      oni.recorder.startRecording()
      recordButton.icon = icons.recordStop
    }
  }

  const recordButton = new TouchBarButton({
    icon: icons.recordStart,
    backgroundColor: "#FF0000",
    click: () => toggleRecording(),
  })

  const developerToolsButton = new TouchBarButton({
    icon: icons.debug,
    click: () => oni.commands.executeCommand("oni.debug.openDevTools"),
  })

  const reloadButton = new TouchBarButton({
    icon: icons.reload,
    click: () => oni.commands.executeCommand("oni.debug.reload"),
  })

  // filtering functions
  const isBrowserBuffer = () => {
    const browserFilePath = /\/Browser\d+$/
    return browserFilePath.test(oni.editors.activeEditor.activeBuffer.filePath)
  }

  const languageCapabilities = () => {
    const language = oni.editors.activeEditor.activeBuffer.language
    return oni.language.getCapabilitiesForLanguage(language)
  }

  // configuration
  let defaults: TouchBarConfiguration = {
    enabled: true,
    escapeItem: "bigger",
    leftActions: "sidebar",
    middleActions: "interaction",
    rightActions: "debug",
  }

  const buildTouchBar = async () => {
    let configuration: TouchBarConfiguration = {
      ...defaults,
      ...oni.configuration.getValue("oni.plugins.touchbar", {}),
    }
    if (!configuration.enabled) {
      remote.getCurrentWindow().setTouchBar(null)
      return
    }

    const escapeItem = () => {
      let item = null
      if (configuration.escapeItem === "bigger") {
        item = biggerEscButton
      } else if (configuration.escapeItem === "close") {
        item = closeButton
      } else if (configuration.escapeItem === "browser") {
        item = browserButton
      }
      return item
    }

    const sidebarActions = () => {
      return [sidebarButton, explorerButton, searchButton]
    }

    const languageActions = async () => {
      let actions = []
      if (isBrowserBuffer()) {
        actions = [
          browserBackButton,
          browserForwardButton,
          browserDeveloperToolsButton,
        ]
      } else {
        const capabilities = await languageCapabilities()
        if (capabilities) {
          if (capabilities.renameProvider) {
            actions = [...actions, renameButton]
          }
          if (capabilities.definitionProvider) {
            actions = [...actions, definitionButton]
          }
          if (capabilities.formattingProvider) {
            actions = [...actions, formatButton]
          } else {
            // if no language server is available, check if prettier can work
            const prettier = await oni.plugins.getPlugin("oni-plugin-prettier")
            if (
              prettier.checkCompatibility &&
              prettier.checkCompatibility(
                oni.editors.activeEditor.activeBuffer.filePath
              )
            ) {
              actions = [...actions, prettierButton]
            }
          }
        }
      }
      return actions
    }

    const debugActions = () => {
      let actions = [
        // recordButton,
        developerToolsButton,
        reloadButton,
      ]
      return actions
    }

    const parseConfigurationActions = async (
      actions: TouchBarActions
    ): Promise<Electron.TouchBarButton[]> => {
      let buttons = []
      if (actions === "sidebar") {
        buttons = [...buttons, ...sidebarActions()]
      } else if (actions === "interaction") {
        buttons = [...buttons, ...(await languageActions())]
      } else if (actions === "debug") {
        buttons = [...buttons, ...debugActions()]
      } else if (actions) {
        buttons = [
          ...buttons,
          ...actions.map(action => {
            let command = () => {}
            if (action.type === "nvim") {
              command = () =>
                oni.editors.activeEditor.neovim.input(action.command)
            } else if (action.type === "oni") {
              command = () => oni.commands.executeCommand(action.command)
            }
            return new TouchBarButton({
              label: action.label,
              click: command,
            })
          }),
        ]
      }
      return buttons
    }

    let items = [
      ...(await parseConfigurationActions(configuration.leftActions)),
      new TouchBarSpacer({ size: "flexible" }),
      ...(await parseConfigurationActions(configuration.middleActions)),
      new TouchBarSpacer({ size: "flexible" }),
      ...(await parseConfigurationActions(configuration.rightActions)),
    ]
    let touchBar = new TouchBar({
      escapeItem: escapeItem(),
      items: items,
    })

    remote.getCurrentWindow().setTouchBar(touchBar)
  }

  buildTouchBar()

  oni.editors.anyEditor.onBufferEnter.subscribe(buildTouchBar) // to detect changes if browser
  oni.editors.anyEditor.onBufferSaved.subscribe(buildTouchBar) // to detect changes in filetype
  oni.configuration.onConfigurationChanged.subscribe(buildTouchBar) // to update configuration
}
