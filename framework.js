//<![CDATA[
/*
 *
 */
function Filter(name, title, fields) {
  this.name = name;
  this.title = title;
  this.fields = fields || [];
  this.errors = [];

  this.set = function(arguments) {
    console.log("Set " + this.name + " arguments: " + arguments);
    this.arguments = [];
    for (index in this.fields) {
      this.arguments.push(arguments[this.fields[index].name]);
    }
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

  this.clean = function() {
    console.log("Clean Filter: " + this.name);
    this.cleaned_data = {};
    for (field in this.fields) {
      this.cleaned_data[this.fields[field].name] = this.fields[field].clean();
    }

    return this.cleaned_data;
  };

  this.handle_submit = function() {
    var filter_name = this.name.split("-")[1];
    console.log("Handle submit: " + filter_name);
    var filter = all_filters[filter_name];
    try {
      var cleaned_data = filter.clean();
    }
    catch (e) {
      console.log("Error: " + e);
    }
    console.log(cleaned_data);

    // If there is no cleaned data, there was an error processing the form.
    // Display the error message and return.  Otherwise, set the cleaned
    // data array.
    if (cleaned_data.length == 0) {
      $("#status").text("There was an error processing your form.");
    }
    else {
      filter.set(cleaned_data);

      if (selected_species) {
        console.log("populate map for species: " + selected_species);
        populateMapBySpecies(selected_species);
      }

      $(this).parent().parent().find(".selected").removeClass("selected");
      $(this).parent().addClass("selected");
    }

    return false;
  };

  this.prepare = function() {
    console.log("Prepare Form: " + this.name);

    for (index in this.fields) {
      this.fields[index].prepare();
    }

    /*
     * Set function for applying the filter defined by this form.
     */
    var form_name = "form-" + this.name;
    var form = $("form[name='" + form_name + "']:first");
    if (form.length == 0) {
      console.log("Error: couldn't find a form called " + form_name + ".  Check your HTML for typos.");
    }
    form.submit(this.handle_submit);
  };
}

function DateFilter(name, title, fields) {
  Filter.call(this, name, title, fields);

  this.set = function(arguments) {
    var start_key;
    var end_key;
    var start_year;
    var end_year;
    var start_month;
    var end_month;
    var start_day;
    var end_day = null;

    if (arguments["startyear"] && arguments["endyear"]) {
      start_year = parseInt(arguments["startyear"]);
      end_year = parseInt(arguments["endyear"]);

      if (arguments["startmonth"] && arguments["endmonth"]) {
        start_month = parseInt(arguments["startmonth"]);
        end_month = parseInt(arguments["endmonth"]);

        if (arguments["startday"] && arguments["endday"]) {
          start_day = parseInt(arguments["startday"]);
          end_day = parseInt(arguments["endday"]);
        }
        else {
          start_day = 1;
        }
      }
      else {
        start_month = 1;
        start_day = 1;
        end_month = 12;
      }

      console.log(start_year + " " + start_month + " " + start_day);
      start_key = new Date(start_year, start_month - 1, start_day);

      if (end_day !== null) {
        console.log(end_year + " " + end_month + " " + end_day);
        end_key = new Date(end_year, end_month - 1, end_day);
      }
      else {
        /*
         * Not all months have the same end day and one month doesn't have the
         * same number of days every year.  To address this, start at the
         * minimum end day possible and add days to date until the date roles
         * into the next month.  Then roll back one day.
         */
        end_day = 28;
        end_key = new Date(end_year, end_month - 1, end_day);
        while(end_key.getMonth() == end_month - 1) {
          end_key.setDate(end_key.getDate() + 1);
        }
        end_key.setDate(end_key.getDate() - 1);
      }

      console.log("Set " + this.name + " arguments: " + start_key + ", " + end_key);
      this.arguments = [start_key, end_key];
    }
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
    return $("input[name='" + this.name + "']:first").val();
  };

  this.prepare = function() {
    console.log("Prepare Field: " + this.name);
  };
}

function ChoiceField(name, options) {
  Field.call(this, name, options);

  this.clean = function() {
    console.log("Clean ChoiceField: " + this.name);
    return $("select[name='" + this.name + "']:first").val();
  };

  this.prepare = function() {
    console.log("Prepare ChoiceField: " + this.name);
    var field = $("select[name='" + this.name + "']:first");
    for (var i = 0; i < this.options.choices.length; i++) {
      var choice = this.options.choices[i];
      console.log("Added choice: " + choice[0] + ", " + choice[1]);
      field.append($("<option value='" + choice[0] + "'>" + choice[1] + "</option>"));
    }
  };
}
ChoiceField.prototype = new Field;
//]]>
