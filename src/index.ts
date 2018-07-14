import { remote } from "electron"
const { TouchBar, nativeImage } = remote
const { TouchBarButton, TouchBarLabel, TouchBarSpacer } = TouchBar
import * as Oni from "oni-api"
import * as path from "path"

const namedImage = (name: String): Electron.nativeImage => {
  const image: Electron.nativeImage = nativeImage.createFromNamedImage(
    `NSTouchBar${name}Template`,
    null
  )
  image.setTemplateImage(true)
  return image
}

const localImage = (name: String): Electron.nativeImage => {
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

  const buildTouchBar = async () => {
    let escapeItem = biggerEscButton

    let items = []

    let sidebarActions = [
      sidebarButton,
      explorerButton,
      searchButton,
      browserButton,
    ]

    items = [
      ...items,
      ...sidebarActions,
      new TouchBarSpacer({ size: "flexible" }),
    ]

    if (isBrowserBuffer()) {
      let browserActions = [
        browserBackButton,
        browserForwardButton,
        browserDeveloperToolsButton,
      ]
      items = [...items, ...browserActions]
    } else {
      let languageActions = []
      const capabilities = await languageCapabilities()
      if (capabilities) {
        if (capabilities.renameProvider) {
          languageActions = [...languageActions, renameButton]
        }
        if (capabilities.definitionProvider) {
          languageActions = [...languageActions, definitionButton]
        }
        if (capabilities.formattingProvider) {
          languageActions = [...languageActions, formatButton]
        } else {
          const prettier = await oni.plugins.getPlugin("oni-plugin-prettier")
          if (
            prettier.checkCompatibility &&
            prettier.checkCompatibility(
              oni.editors.activeEditor.activeBuffer.filePath
            )
          ) {
            languageActions = [...languageActions, prettierButton]
          }
        }
      }
      items = [...items, ...languageActions]
    }

    let debugActions = [
      // recordButton,
      developerToolsButton,
      reloadButton,
    ]
    items = [
      ...items,
      new TouchBarSpacer({ size: "flexible" }),
      ...debugActions,
    ]

    let touchBar = new TouchBar({
      escapeItem: escapeItem,
      items: items,
    })

    remote.getCurrentWindow().setTouchBar(touchBar)
  }

  buildTouchBar()

  oni.editors.anyEditor.onBufferEnter.subscribe(buildTouchBar)
}
