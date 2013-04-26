$(function(){
  editor = ace.edit("editor");
  editor.setTheme("ace/theme/tomorrow");
  editor.setShowPrintMargin(false);
  editor.getSession().setMode("ace/mode/janus");
  editor.getSession().setTabSize(4);
  editor.getSession().setUseSoftTabs(true);

  var $editor = $("#editor");
  var $outputPane = $("#output-pane");
  var $output = $("#output");
  var $executing = $("#output-pane .executing");

  function showExample(exampleId) {
    var match = exampleId.match(/#examples\/([a-zA-Z0-9-]+)/);
    if (match) {
      $.get("examples/" + match[1] + ".ja", function(data) {
        editor.setValue(data);
        editor.gotoLine(0);
        removeErrorMarkers();
      });
    }
  }

  var prevErrors = [];
  function removeErrorMarkers() {
    var session = editor.getSession();
    for (var i = 0; i < prevErrors.length; ++i) {
      session.removeGutterDecoration(prevErrors[i], "errorGutter");
      prevErrors = [];
    }
  }

  function showOutputPane() {
    $outputPane.show();
    $editor.css("bottom", $outputPane.outerHeight()+"px");
    $editor.resize();
  }

  function hideOutputPane() {
    $outputPane.hide();
    $editor.css("bottom", "0");
    $editor.resize();
  }

  function formatOutput(output) {
    // First line contains the exit code
    var retval = parseInt(output.substr(0, output.indexOf("\n")));
    output = output.substring(output.indexOf("\n") + 1);
    console.log(retval);

    removeErrorMarkers();
    if (retval > 0) {
      var session = editor.getSession();
      var match = output.match(/line (\d+), column (\d+)/);

      if (match) {
        var line = parseInt(match[1]) - 1;
        session.addGutterDecoration(line, "errorGutter");
        prevErrors.push(line);
      }
      $output.html($("<pre>").html(output).addClass("error"));
    } else {
      $output.html($("<pre>").html(output));
    }
  }

  function formatError(data) {
    $output.append(
      '<div class="alert alert-error">An error occured while trying to run the program.</div>'
    );
  }

  $("#examples a").click(function(e) {
    showExample(e.target.hash);
  });

  $("#run").click(function() {
    showOutputPane();
    $executing.show();
    $output.empty();
    var code = editor.getValue();
    var intSize = $("#options input[name='options-int-size']:checked").val();
    $.post("execute.php", {
      "code": code,
      "intsize": intSize
    })
    .done(formatOutput)
    .fail(formatError)
    .always(function() { $executing.hide(); })
  });

  $("#output-pane button.close").click(function() {
    $("#output-pane").hide();
    $("#editor").css("bottom", "0px");
    editor.resize();
  });

  showExample(window.location.hash);
});
