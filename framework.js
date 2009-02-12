//<![CDATA[
/*
 *
 */
function Filter(name, title, help_text, fields) {
  this.name = name;
  this.title = title;
  this.help_text = help_text;
  this.fields = fields || [];
  this.errors = [];

  this.set = function(arguments) {
    console.log("Set " + this.name + " arguments: " + arguments);
    this.arguments = arguments;
  };

  this.unset = function() {
    if (this.arguments) {
      console.log("Unset " + this.name + " arguments");
      delete this.arguments;
    }
  };

  this.filter = function(record) {
    if (this.arguments === undefined) {
      return true;
    }

    //console.log("Filter: " + this.name);
    var startkey = this.arguments[0];
    var endkey = this.arguments[1];
    var value = record[this.name];
    if (value < startkey || value > endkey) {
      return false;
    }
    return true;
  };

  this.validate = function() {
    console.log("Validate Form");
    var valid = true;
    for (field in this.fields) {
      if (fields[field].validate()) {
        valid = false;
        break;
      }
    }

    return valid;
  };

  this.clean = function(data) {
    console.log("Clean Filter: " + this.name);

//     this.cleaned_data = {};
//     for (field in fields) {
//       this.cleaned_data[fields[field].name] = fields[field].clean();
//     }
    var inputs = data.children("input");
    var startkey = inputs.val();
    var endkey = inputs.next().val();
    console.log("Found start key: " + startkey);
    console.log("Found end key: " + endkey);

    /*
     * If the keys can be converted to integers they should be so filtering
     * works as expected.
     */
    var cleaned_data = [];
    try {
      startkey = parseInt(startkey);
      endkey = parseInt(endkey);
      cleaned_data = [startkey, endkey];
    }
    catch (error) {
    }

    return cleaned_data;
  };

  this.build = function() {
    console.log("Build Form: " + this.name);

    // Add form for custom filter range.
    var form = $("<form id='form-" + this.name + "'></form>");
    form.attr("name", this.name);

    startkey_field = this.fields[0].build();
    form.append(startkey_field);
    form.append(" - ");

    endkey_field = this.fields[1].build();
    form.append(endkey_field);
    form.append($("<input type='submit' value='Filter' />"));

    if (this.help_text) {
      form.append($("<br /><span class='help'>" + this.help_text + "</span>"));
    }

    /*
     * Set function for applying the filter defined by this form.
     */
    form.submit(function() {
      var filter = all_filters[this.name];
      var inputs = $(this);
      var cleaned_data = filter.clean(inputs);

      // If there is no cleaned data, there was an error processing the form.
      // Display the error message and return.  Otherwise, set the cleaned
      // data array.
      if (cleaned_data.length == 0) {
        $("#status").text("There was an error processing your form.");
      }
      else {
        filter.set(cleaned_data);

        if (selected_species) {
          populateMapBySpecies(selected_species);
        }

        $(this).parent().parent().find(".selected").removeClass("selected");
        $(this).parent().addClass("selected");
      }

      return false;
    });

    return form;
  };
}

function DateFilter(name, title, help_text, fields) {
  Filter.call(this, name, title, help_text, fields);

  this.clean = function(data) {
    console.log("Clean DateFilter: " + this.name);

    var inputs = data.children("select");
    var startkey = inputs.val();
    var endkey = inputs.next().val();
    console.log("Found start key: " + startkey);
    console.log("Found end key: " + endkey);

    /*
     * If the keys can be converted to integers they should be so filtering
     * works as expected.
     */
    var cleaned_data = [];
    try {
      startkey = parseInt(startkey);
      endkey = parseInt(endkey);
      cleaned_data = [startkey, endkey];
    }
    catch (error) {
    }

    return cleaned_data;
  };
}
DateFilter.prototype = new Filter;

/*
 *
 */
function Field(name, options) {
  this.name = name;
  this.options = options || {};
  this.options.required = typeof(this.options.required) === undefined ? true : this.options.required;
  this.options.label = this.options.label || "";
  this.options.help_text = this.options.help_text || "";

  this.validate = function() {
    console.log("Validate Field: " + this.name);
  };

  this.clean = function() {
    console.log("Clean Field: " + this.name);
  };

  this.build = function() {
    console.log("Build Field: " + this.name);
    var field = $("<input type='text' size='5' />");
    field.attr("name", this.name);
    return field;
  };
}

function ChoiceField(name, options) {
  Field.call(this, name, options);

  this.build = function() {
    console.log("Build ChoiceField: " + this.name);
    var field = $("<select type='text' size='1'></select>");
    field.attr("name", this.name);
    for (var i = 0; i < this.options.choices.length; i++) {
      var choice = this.options.choices[i];
      console.log("Added choice: " + choice[0] + ", " + choice[1]);
      field.append($("<option value='" + choice[0] + "'>" + choice[1] + "</option>"));
    }
    return field;
  };
}
ChoiceField.prototype = new Field;
//]]>
