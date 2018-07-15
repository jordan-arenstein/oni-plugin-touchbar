# oni-plugin-touchbar

A plugin for Oni which enables functionality for a macOS Touch Bar

![default configuration](default-configuration.png)

## Touch Bar Configuration
A custom configuration is passed to the plugin as an object through the "oni.plugins.touchbar" option.
* `enabled: boolean`
* `escapeItem: "bigger" | "close"`
  * `"bigger"` expands the escape button on the Touch Bar
  * `"close"` saves and quits the current file, by `:wq`
* `leftActions`, `middleActions`, and `rightActions` each describe the commands in the respective sections of the Touch Bar
  * `"sidebar"` shows commands which toggle panes in the Oni sidebar. These are restricted to the file explorer and search (for now).
  * `"interaction"` shows commands which interact with the current buffer, through commands defined by a language server. If the current language has no language server, this will be blank. If the current buffer is a browser, this will show browser commands.
  * `"debug"` shows commands which help when working on Oni itself.
  * this can also be a list of custom actions, defined as `{ label: string, type: "nvim" | "oni", command: string }[]`

### Default Configuration
```typescript
{
  enabled: true,
  escapeItem: "bigger",
  leftActions: "sidebar",
  middleActions: "interaction",
  rightActions: "debug",
}
```

### Configuration with Custom Commands
![custom configuration](custom-configuration.png)
```typescript
{
  enabled: true,
  escapeItem: "bigger",
  leftActions: null,
  middleActions: [
    { label: ":q", type: "nvim", command: "<esc>:q<enter>" },
    { label: ":w", type: "nvim", command: "<esc>:w<enter>" },
    { label: ":sp", type: "nvim", command: "<esc>:sp<enter>" },
    { label: "new Oni window", type: "oni", command: "oni.process.openWindow" },
    { label: "open folder", type: "oni", command: "workspace.openFolder" },
  ],
  rightActions: null,
},
```
