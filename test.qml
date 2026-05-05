import QtQuick
Item {
    Component.onCompleted: console.log(Qt.resolvedUrl("daemon.py").toString())
}
