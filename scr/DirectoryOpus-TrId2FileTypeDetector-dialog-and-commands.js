var fileMimeTypeDetector = new ActiveXObject("DOpusScriptingExtensions.FileMimeTypeDetector")
var uCharDet = new ActiveXObject("DOpusScriptingExtensions.UCharDet");
var trId2FileTypeDetector = new ActiveXObject("DOpusScriptingExtensions.TrId2FileTypeDetector")

function /* void */ OnInit(/* ScriptInitData */ data) {
  data.name = "DirectoryOpus-TrId2FileTypeDetector-dialog-and-commands"
  data.desc = "Dialog to show file type information based on the content of the file. A command to fix or add file name extension based on the file type"
  data.default_enable = true
  data.version = "2.0"
  data.url = "https://github.com/PolarGoose/DirectoryOpus-FileLockingInfo-columns-and-dialog"

  data.config.debug = false
  data.config.debug.desc = "Print debug messages to the script log"

  var cmd = data.AddCommand()
  cmd.name = "TrId2FileTypeDetector_FixFileExtension"
  cmd.method = "onFixFileExtension"
  cmd.template = "FILE"
  cmd.desc = "Adds or fixes the extension of the file based on the file type"
  cmd.label = "Fix filename extension"

  var cmd = data.AddCommand()
  cmd.name = "TrId2FileTypeDetector_OpenDialog"
  cmd.method = "onOpenDialog"
  cmd.template = "FILE"
  cmd.desc = data.desc
  cmd.label = "TrId2FileTypeDetector dialog"
}

function /* void */ onFixFileExtension(/* ScriptCommandData */ scriptCommandData) {
  try {
    var args = scriptCommandData.func.args

    if (!args.got_arg.file) {
      throw "FILE argument is not provided"
    }

    var res = new VBArray(trId2FileTypeDetector.DetectFileType(args.file, 1)).toArray()
    if (res.length == 0) {
      throw "No file type detected"
    }

    debug("Detected file type: '" + res[0].Name + "'")

    var extensions = new VBArray(res[0].FileNameExtensions).toArray()
    if (extensions.length == 0) {
      throw "Detected file type '" + res[0].Name + "' does not provide file name extensions"
    }

    var extension = extensions[0]
    if (extension == "") {
      throw "Detected extension is empty"
    }

    debug("Detected file name extension: '" + extension + "'")

    extension = "." + extension

    var path = DOpus.FSUtil.NewPath(args.file)

    if (path.ext == extension) {
      debug("Extension is already correct: " + String(path))
      return
    }

    path.ext = extension
    var command = 'Rename FROM "' + args.file + '" TO "' + path + '"'

    debug("Run command '" + command + "'")

    var result = scriptCommandData.func.command.RunCommand(command)
    if (result == 0) {
      throw "Rename command failed: '" + command + "'"
    }
  } catch (error) {
    showErrorDialog(String(error))
  }
}

function onOpenDialog(/* ScriptCommandData */ scriptCommandData) {
  try {
    var args = scriptCommandData.func.args
    if (!args.got_arg.file) {
      throw "FILE argument is not provided"
    }

    var trId2Candidates = new VBArray(trId2FileTypeDetector.DetectFileType(args.file, 5)).toArray()
    var uCharDetEncoding = uCharDet.DetectFileEncoding(args.file, 2048)
    var mimeType = fileMimeTypeDetector.DetectMimeType(args.file)

    var dlg = DOpus.Dlg
    dlg.template = "main"
    dlg.Create()
    var listView = dlg.Control("CandidatesInfoListView")

    addItemToListView(listView, "File name", args.file, /* bold */ false)
    addItemToListView(listView, "Mime type", mimeType.MimeType + ", " + mimeType.Encoding, /* bold */ false)
    addItemToListView(listView, "UcharDet", uCharDetEncoding, /* bold */ false)
    listView.AddItem("")

    for (var i = 0; i < trId2Candidates.length; i++) {
      addItemToListView(listView, "#" + (i + 1), trId2Candidates[i].Name, /* bold */ true)
      addItemToListView(listView, "Probability", trId2Candidates[i].Probability.toFixed(1).replace(".", ",") + "%", /* bold */ false)
      addItemToListView(listView, "Description", trId2Candidates[i].Description, /* bold */ false)
      addItemToListView(listView, "Extensions", new VBArray(trId2Candidates[i].FileNameExtensions).toArray().join(", "), /* bold */ false)
      addItemToListView(listView, "MimeType", trId2Candidates[i].MimeType, /* bold */ false)
      addItemToListView(listView, "Url", trId2Candidates[i].Url, /* bold */ false)
    }
    listView.columns.autosize()

    dlg.RunDlg()
  } catch (error) {
    showErrorDialog(error)
  }
}

function /* void */ debug(/* string */ text) {
  if (Script.config.debug) { DOpus.Output(text) }
}

function /* void */ addItemToListView(/* Control */ listView, /* string */ tagName, /* string */ value, /* bool */ bold) {
  if (value == null || value == "") { return }
  var i = listView.AddItem(tagName)
  listView.GetItemAt(i).subitems(0) = value
  if (bold) {
    listView.GetItemAt(i).style = "b"
  }
}

function /* void */ showErrorDialog(/* string */ message) {
  var dlg = DOpus.Dlg
  dlg.message = message
  dlg.buttons = "OK"
  dlg.icon = "error"
  dlg.show()
}

==SCRIPT RESOURCES
<resources>
  <resource name="main" type="dialog">
    <dialog height="270" lang="english" resize="yes" title="TrId2 dialog" width="450">
      <control fullrow="yes" height="600" name="CandidatesInfoListView" noheader="yes" nosortheader="yes" resize="wh" type="listview" viewmode="details" width="600" x="0" y="0">
        <columns>
          <item text="Col1" />
          <item text="Col2" />
        </columns>
      </control>
    </dialog>
  </resource>
</resources>
