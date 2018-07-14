import { remote } from "electron"
const { TouchBar, nativeImage } = remote
const { TouchBarButton, TouchBarLabel, TouchBarSpacer } = TouchBar
import * as Oni from "oni-api"
import { join } from "path"

interface Icons {
  browser: Electron.nativeImage
  browserBack: Electron.nativeImage
  browserForward: Electron.nativeImage
  debug: Electron.nativeImage
  definition: Electron.nativeImage
  explorer: Electron.nativeImage
  format: Electron.nativeImage
  learn: Electron.nativeImage
  marks: Electron.nativeImage
  plugins: Electron.nativeImage
  recordStart: Electron.nativeImage
  recordStop: Electron.nativeImage
  reload: Electron.nativeImage
  rename: Electron.nativeImage
  search: Electron.nativeImage
  sidebar: Electron.nativeImage
}
export const activate = (oni: Oni.Plugin.Api) => {
  const shift = [0, 0, 0]
  const icons: Icons = {
    browser: nativeImage.createFromNamedImage("NSTouchBarOpenInBrowserTemplate", shift),
    browserBack: nativeImage.createFromNamedImage("NSTouchBarGoBackTemplate", shift),
    browserForward: nativeImage.createFromNamedImage("NSTouchBarGoForwardTemplate", shift),
    debug: nativeImage.createFromPath(join(__dirname, "..", "icons/debug.png")),
    definition: nativeImage.createFromPath(
      join(__dirname, "..", "icons/definition.png")
    ),
    explorer: nativeImage.createFromPath(
      join(__dirname, "..", "icons/explorer.png")
    ),
    format: nativeImage.createFromPath(
      join(__dirname, "..", "icons/format.png")
    ),
    learn: nativeImage.createFromPath(join(__dirname, "..", "icons/learn.png")),
    marks: nativeImage.createFromPath(join(__dirname, "..", "icons/marks.png")),
    plugins: nativeImage.createFromPath(
      join(__dirname, "..", "icons/plugins.png")
    ),
    recordStart: nativeImage.createFromNamedImage(
      "NSTouchBarRecordStartTemplate",
      shift
    ),
    recordStop: nativeImage.createFromNamedImage(
      "NSTouchBarRecordStopTemplate",
      shift
    ),
    reload: nativeImage.createFromNamedImage(
      "NSTouchBarRefreshTemplate",
      shift
    ),
    rename: nativeImage.createFromPath(
      join(__dirname, "..", "icons/rename.png")
    ),
    search: nativeImage.createFromNamedImage("NSTouchBarSearchTemplate", shift),
    sidebar: nativeImage.createFromNamedImage(
      "NSTouchBarSidebarTemplate",
      shift
    ),
  }
  for (let name in icons) {
    icons[name].setTemplateImage(true)
  }

  const biggerEscButton = new TouchBarButton({
    label: "escape",
    click: () => {
      oni.editors.activeEditor.neovim.input("<esc>")
    },
  })

  const sidebarButton = new TouchBarButton({
    icon: icons.sidebar,
    click: () => {
      oni.commands.executeCommand("sidebar.toggle")
    },
  })

  const explorerButton = new TouchBarButton({
    icon: icons.explorer,
    click: () => {
      oni.commands.executeCommand("explorer.toggle")
    },
  })

  const searchButton = new TouchBarButton({
    icon: icons.search,
    click: () => {
      oni.commands.executeCommand("search.searchAllFiles")
    },
  })

  const renameButton = new TouchBarButton({
    icon: icons.rename,
    click: () => {
      oni.commands.executeCommand("editor.rename")
    },
  })

  const definitionButton = new TouchBarButton({
    icon: icons.definition,
    click: () => {
      oni.commands.executeCommand("language.gotoDefinition")
    },
  })

  const formatButton = new TouchBarButton({
    icon: icons.format,
    click: () => {
      oni.commands.executeCommand("autoformat.prettier")
    },
  })

  const recordButton = new TouchBarButton({
    icon: icons.recordStart,
    backgroundColor: "#FF0000",
    click: () => {
      if (oni.recorder.isRecording) {
        oni.commands.executeCommand("keyDisplayer.hide")
        oni.recorder.stopRecording()
        recordButton.icon = icons.recordStart
      } else {
        oni.commands.executeCommand("keyDisplayer.show")
        oni.recorder.startRecording()
        recordButton.icon = icons.recordStop
      }
    },
  })

  const developerToolsButton = new TouchBarButton({
    icon: icons.debug,
    click: () => {
      oni.commands.executeCommand("oni.debug.openDevTools")
    },
  })

  const reloadButton = new TouchBarButton({
    icon: icons.reload,
    click: () => {
      oni.commands.executeCommand("oni.debug.reload")
    },
  })

  const browserButton = new TouchBarButton({
    icon: icons.browser,
    click: () => {
      oni.commands.executeCommand("browser.openUrl")
      // oni.editors.activeEditor.activeBuffer.getLayerById("oni.browser")
    }
  })

  const browserBackButton = new TouchBarButton({
    icon: icons.browserBack,
    click: () => {
      oni.commands.executeCommand("browser.goBack")
    }
  })

  const browserForwardButton = new TouchBarButton({
    icon: icons.browserForward,
    click: () => {
      oni.commands.executeCommand("browser.goForward")
    }
  })

  const browserDeveloperToolsButton = new TouchBarButton({
    icon: icons.debug,
    click: () => {
      oni.commands.executeCommand("browser.debug")
    }
  })

  const isBrowserBuffer = (buffer: Oni.Buffer) => {
    let browserFilePath = /\/Browser\d+$/
    return browserFilePath.test(buffer.filePath)
  }

  const buildTouchBar = async () => {
    let escapeItem = biggerEscButton

    const sidebarActions = [sidebarButton, explorerButton, searchButton, browserButton]
    const languageActions = [renameButton, formatButton, definitionButton]
    const browserActions = [browserBackButton, browserForwardButton, browserDeveloperToolsButton]
    const debugActions = [recordButton, developerToolsButton, reloadButton]

    let items = []
    items = [...items,
      ...sidebarActions,
      new TouchBarSpacer({ size: "flexible" }),
    ]
    if (isBrowserBuffer(oni.editors.activeEditor.activeBuffer)) {
      items = [ ...items, ...browserActions]
    } else {
      items = [ ...items, ...languageActions]
    }

    items = [...items,
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
