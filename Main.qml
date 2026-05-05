import QtQuick
import Quickshell.Io
import qs.Services.UI

Item {
  property var pluginApi: null

  IpcHandler {
    target: "plugin:superproductivity-shell"
    function toggle() {
      if (pluginApi) {
        pluginApi.withCurrentScreen(screen => {
          ToastService.showNotice("SuperProductivity Toggle!");
        });
      }
    }
  }
}
