import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Services.UI
import qs.Widgets

NIconButton {
  id: root

  property var pluginApi: null

  property ShellScreen screen
  property string widgetId: ""
  property string section: ""
  property int sectionWidgetIndex: -1
  property int sectionWidgetsCount: 0

  property var cfg: pluginApi?.pluginSettings || ({})
  property var defaults: pluginApi?.manifest?.metadata?.defaultSettings || ({})

  readonly property string iconColorKey: cfg.iconColor ?? defaults.iconColor
  
  property string currentTaskText: "SP"

  icon: "check-circle"
  tooltipText: currentTaskText
  tooltipDirection: BarService.getTooltipDirection(screen?.name)
  baseSize: Style.getCapsuleHeightForScreen(screen?.name)
  applyUiScale: false
  customRadius: Style.radiusL
  colorBg: Style.capsuleColor
  colorFg: Color.resolveColorKey(iconColorKey)

  border.color: Style.capsuleBorderColor
  border.width: Style.capsuleBorderWidth

  // We could add a Process element to call `superproductivity-cli`
  // Process { ... }

  onClicked: {
    // Just a placeholder action. Here we could invoke CLI command to launch SuperProductivity
    ToastService.showNotice("SuperProductivity clicked!");
  }

  NPopupContextMenu {
    id: contextMenu

    model: [
      {
        "label": "Mark as Done",
        "action": "done",
        "icon": "check"
      },
      {
        "label": "Start/Stop Timer",
        "action": "timer",
        "icon": "clock"
      }
    ]

    onTriggered: function (action) {
      contextMenu.close();
      PanelService.closeContextMenu(screen);
      if (action === "done") {
        ToastService.showNotice("Task marked as done");
      } else if (action === "timer") {
        ToastService.showNotice("Timer toggled");
      }
    }
  }

  onRightClicked: {
    PanelService.showContextMenu(contextMenu, root, screen);
  }
}
