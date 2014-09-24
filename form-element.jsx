
var React = require('../../../lib/react-0.11.1');

var FormElement = React.createClass({

  getInitialState: function (){
    return {
      initVal: this.props.config.initVal
    }
  },

  // Iterate through the options
  // TODO: sort the option by the 'order' param
  processOptions: function (selected){
    this.props.config.layout.options.sort(function (a, b) {
      if (a.sortOrder > b.sortOrder){
        return 1;
      }

      if (a.sortOrder < b.sortOrder) {
        return -1;
      }

      return 0;
    });

    var options = this.props.config.layout.options.map(function (opt, i) {
      return <option
              key={opt.key}
              value={opt.key}
              disabled={!opt.isEnabled}>
                {opt.display}
            </option>;
    });

    // Add 'placeholder' as first select option
    options.splice(0, 0, <option key='-1' value=''>
                            -- Select an Option --
                         </option>);

    return options;

  },

  getValue: function () {
    return this.refs[this.props.config.key].getDOMNode().value;
  },

  /**
   * Alias for validate()
   * @see validate
   */
  handleBlur: function () {
    if(this.validate()) {
      this.props.save(this.props.ref, this.getValue());
    }
  },

  /**
   * This method is called everytime a form element is altered/chaged.
   * If it has a validation Regular Expression then it is tested and if
   * it fails that test then error classes are applied to it.
   * @return {[boolean]} pass
   */
  validate: function (dependency) {

    this.setState({initVal: this.getValue()});

    var key = this.props.config.key;
    var invalidClasses = ' dirty invalid';
    var elem = this.refs[key].getDOMNode();
    var pass;

    // Checkboxes will still have a value if they aren't 'checked' so,
    // when validating they need to alter the value depending on whether the
    // box is checked or not.
    if(elem.type === 'checkbox') {
      if(!elem.checked) {
        elem.value = '';
      } else {
        elem.value = 'on';
      }
    }

    // Checking for required class, so we can validate 'required' elements
    // in IE8 and IE9
    var requiredClass = elem.className.split(' ').indexOf('required');
    if(requiredClass > 0) {
      elem.required = true;
    }

    // If the element has a value, and isn't required and isn't being
    // validated as a dependency, then consider it a valid input.
    //
    // If there isn't a value and the element is either required or
    // being evaluated as a dependency then consider it an invalid input.
    //
    // Other ways, evaluate the element and its value based on the supplied
    // Regular Expression set as an attribute.
    if(elem.value.length === 0 && !elem.required && !dependency) {
      pass = true;
    } else if(elem.value.length === 0 && (elem.required || dependency)){
      pass = false;
    } else {
      var pattern = new RegExp(this.props.config.validationRegex);
      pass = pattern.test(elem.value);
    }

    // Add remove the invalid classes based on if the
    // element passed validation
    if(!pass && elem.className.indexOf(invalidClasses) == -1) {
      elem.className += invalidClasses;
    } else if(pass) {
      elem.className = elem.className.replace(invalidClasses, '').trim();
    }

    // Return result
    return pass;
  },

  /**
   * This render function will dynamically generate a form element from the
   * current element configuration provided by the Form class
   *
   * @return {[jsx]} [HTML Form Element]
   * @todo Support more HTML form elements
   */
  render: function () {
    var type = this.props.config.layout.fieldType;
    var element;
    var styles = 'aio-form-input';
    var width = ' aio-col-' + 12 / (100 / this.props.config.layout.fieldStyle);

    // Enable 'required' attribute through class, IE8/9
    if(this.props.config.required) {
      styles += ' required';
    }

    switch (type) {
      case 'phone-us':
      case 'text':
      case 'input':
          element = <div>
                      <label className='aio-form-label'>{this.props.config.name}
                        { this.props.config.required ? <span className='aio-astx'>&nbsp; *</span> : null }
                      </label>
                      <input
                        className={styles}
                        type={type}
                        name={this.props.config.key}
                        ref={this.props.config.key}
                        value={this.state.initVal}
                        required={this.props.config.required}
                        placeholder={this.props.config.name}
                        pattern={this.props.config.validationRegex}
                        validate={this.validate}
                        dependencies={this.props.config.dependencies}
                        onBlur={this.handleBlur}
                        onChange={this.validate} />
                    </div>;

          break;
        case 'select' :
          var options = this.processOptions(this.state.initVal);
          element = <div>
                      <label className='aio-form-label'>{this.props.config.name}
                        { this.props.config.required ? <span className='aio-astx'> *</span> : null }
                      </label>
                      <select
                        className={styles}
                        name={this.props.config.name}
                        pattern={this.props.config.validationRegex}
                        required={this.props.config.required}
                        defaultValue={this.state.initVal}
                        ref={this.props.config.key}
                        id={this.props.config.key}
                        validate={this.validate}
                        dependencies={this.props.config.dependencies}
                        onBlur={this.handleBlur}
                        onChange={this.validate} >
                      {options}
                      </select>
                    </div>;
          break;

        case 'checkbox' :
          element = <div>
              <input
                type='checkbox'
                ref={this.props.config.key}
                name={this.props.config.key}
                id={this.props.config.key}
                validate={this.validate}
                defaultValue={this.state.initVal}
                dependencies={this.props.config.dependencies} />
              <label htmlFor={this.props.config.key}>{this.props.config.name}</label>
            </div>;
          break;
        //This form element type is used for things like the TCPA disclocsure
        case 'staticText' :
          element = <div>
                      <span>{this.props.config.name}</span>
                      <input type='hidden' validate={this.validate} ref={this.props.config.key} value={this.props.config.name} />
                    </div>;
          break;
        default :
          element = <div>{this.props.config.type}</div>;

      };

      element = <div className={width}>{element}</div>;

      return element;
  }
});

module.exports = FormElement;
