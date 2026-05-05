import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Services.UI
import qs.Widgets
import QtQml.Models
import QtQuick
import QtQuick.Layouts

Item {
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

  width: layout.width
  height: Style.getCapsuleHeightForScreen(screen?.name)

  Row {
      id: layout
      height: parent.height
      spacing: 6

      NIconButton {
          anchors.verticalCenter: parent.verticalCenter
          icon: "check-circle"
          tooltipText: "Click: Toggle Timer | Right-Click: Options"
          tooltipDirection: BarService.getTooltipDirection(screen?.name)
          baseSize: parent.height
          applyUiScale: false
          customRadius: Style.radiusL
          colorBg: Style.capsuleColor
          colorFg: Color.resolveColorKey(iconColorKey)
          border.color: Style.capsuleBorderColor
          border.width: Style.capsuleBorderWidth

          onClicked: postAction("toggle-timer")
          onRightClicked: PanelService.showContextMenu(contextMenu, root, screen)
      }

      Text {
          anchors.verticalCenter: parent.verticalCenter
          text: root.currentTaskText
          color: "#ffffff"
          font.pixelSize: 13
      }
  }

  Process {
      id: daemonProcess
      command: ["bash", "-c", "python3 \"$1\" > /tmp/sp-daemon.log 2>&1", "--", Qt.resolvedUrl("daemon.py").toString().replace("file://", "")]
      running: true
  }

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

  function formatTime(ms) {
      if (!ms) return "";
      var totalSeconds = Math.floor(ms / 1000);
      var hours = Math.floor(totalSeconds / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) return hours + "h " + minutes + "m";
      return minutes + "m";
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
                          var text = data.title;
                          if (data.timeSpent > 0 || data.timeEstimate > 0) {
                              var spent = formatTime(data.timeSpent);
                              var est = formatTime(data.timeEstimate);
                              if (est) text += " [" + spent + " / " + est + "]";
                              else if (spent) text += " [" + spent + "]";
                          }
                          root.currentTaskText = text;
                      } else {
                          root.currentTaskText = "No active task";
                      }
                  } catch(e) {
                      root.currentTaskText = "Error parsing data";
                  }
              } else {
                  root.currentTaskText = "SP Dead (path: " + Qt.resolvedUrl("daemon.py").toString().replace("file://", "") + ")";
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

}
