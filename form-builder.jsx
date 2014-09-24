
/**
* Form Builder module for generating forms via JSON in React.js
* @author Cecil Worsley <cworsley@redventures.net>
* @since 2014-08-05
* @jsx React.DOM
*/

var React = require('../../lib/react-0.11.1');
var FormElement = require('./form-builder/form-element.jsx');
var storage = require('../lib/storage');
var debug = require('../../lib/debug/debug')('aio:app:components:formbuilder');

var FormBuilder = React.createClass({

  /**
   * When the form is submitted by the user, we loop through the values
   * of the returned object and abstract their values before sending it
   * up to the API.
   * @param  {[string]} event
   */
  handleSubmit: function (event) {
    event.preventDefault();
    var i, key, pattern;
    var errors = [];
    var form = {};
    var errorText = 'Please properly fill in the following field(s)';
    var hasErrors = false;
    var erroredKeys = [];

    /**
     * This appends errors to an error string as long as it hasn't
     * already been added. Elements and their validity can be checked multiple
     * times if more than one element has another listed as a dependency.
     *
     * @param  {[type]} elem [description]
     * @return {[type]}      [description]
     */
    function appendToErrors(elem) {
      elem = elem.getDOMNode();
      var name = elem.placeholder || elem.name;

      if(erroredKeys.indexOf(name) === -1) {
        errorText += ', ' + name;
        hasErrors = true;
        erroredKeys.push(name);
      }
    }

    /**
     * This is used for checkboxes,
     * @param  {[object]}  elem
     * @return {Boolean}
     */
    function isApplicable(elem) {
      elem = elem.getDOMNode();
      if(elem.type === 'checkbox') {
        if(elem.checked) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    }

    //Validation magic
    /*
     * This will loop through all of the references contained on this
     * form class (this.refs). They are created when the form config is looped
     * through in the render method. The validation method is invoked,
     * if that passes validation and it has listed dependencies, then they
     * are validated as well.
     */
    for(i=0; i < Object.keys(this.refs).length; i++) {
      // Get the key of the currently selected reference.
      key = Object.keys(this.refs)[i];
      // Get the element associated with the key
      elem = this.refs[key].refs[key];
      // Get the value of the DOM element and set on the form object
      form[key] = this.refs[key].refs[key].getDOMNode().value;
      // Check validation
      if(!elem.props.validate()) {
        appendToErrors(elem); //Append to the errors array, add to errors output
      } else {
        // On valid input, validate the elements dependencies if there are any.
        if (elem.props.dependencies
          && elem.props.validate()
          && isApplicable(elem)) {
            // Get the list of dependencies
            var dependencies = elem.props.dependencies;
            var depRef, k;
            // Loop through and validate accordingly
            for (k=0; k < dependencies.length; k++) {
              depRef = this.refs[dependencies[k]];
              if (!depRef.validate(true)) {
                appendToErrors(depRef.refs[dependencies[k]]);
              }
            }
        }
      }
    }

    // Set errors if there are any.
    if(hasErrors) {
      this.props.errors = errors;
    } else {
      errorText = '';
    }

    this.props.submit.send(form, errorText);
    return false;
  },

  save: function (key, value) {
    // Get current cookied data for the specified cookie key
    cookieData = this.retrieve(this.props.cookie);
    // Set new value
    cookieData[key] = value;
    // And finally set back on cookie
    storage.cookie.set(this.props.cookie, JSON.stringify(cookieData));
  },

  retrieve: function (key) {
    try {
      return JSON.parse(storage.cookie.get(key)) || {};
    } catch(e) {
      return {};
    }
  },

  /**
   * Render a form, dynamically, from a JSON string
   * This Form Builder supports groups
   * @return {[jsx]} Dynamically generated form
   */
  render: function () {

    var group_index;
    var self = this;
    var cookiedInputs = this.retrieve(this.props.cookie);

    // Loop through the form groups and add generate the elements they contain
    var groups = this.props.form.fields.map(function (group, index) {
      group_index = index;
      var element = group.map(function (field, index) {
        field.initVal = cookiedInputs[field.key] || '';
        return <FormElement
                  key={index}
                  ref={field.key}
                  save={self.save}
                  config={field} />;
      });
      return <div key={index} className='aio-form-group'>{element}</div>;
    });

    this.props.severity = this.props.severity || 'primary';
    var classes = 'aio-btn aio-btn-block js-aio-btn-startchat aio-btn-' + this.props.severity;
    return <form onSubmit={this.handleSubmit}>
            {groups}
            <button className={classes} type='submit'>
              {this.props.submit.title}
            </button>
          </form>;
  }
});

module.exports = FormBuilder;
