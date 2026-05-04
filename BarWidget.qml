import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Services.UI
import qs.Widgets
import QtQml.Models
import QtQuick

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
  
  property string currentTaskText: "SuperProductivity"

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

  Timer {
      id: pollTimer
      interval: 5000
      running: true
      repeat: true
      onTriggered: {
          fetchActiveTask();
      }
  }

  Component.onCompleted: {
      fetchActiveTask();
  }

  function fetchActiveTask() {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://127.0.0.1:30142/current-task");
      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                  try {
                      var data = JSON.parse(xhr.responseText);
                      if (data && data.title) {
                          root.currentTaskText = data.title;
                      } else {
                          root.currentTaskText = "No active task";
                      }
                  } catch(e) {
                      root.currentTaskText = "Error parsing data";
                  }
              } else {
                  root.currentTaskText = "SP Not Running";
              }
          }
      };
      xhr.send();
  }

  function postAction(endpoint) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "http://127.0.0.1:30142/" + endpoint);
      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
              fetchActiveTask();
          }
      };
      xhr.send();
  }

  onClicked: {
      postAction("toggle-timer");
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
        postAction("mark-done");
      } else if (action === "timer") {
        postAction("toggle-timer");
      }
    }
  }

  onRightClicked: {
    PanelService.showContextMenu(contextMenu, root, screen);
  }
}
