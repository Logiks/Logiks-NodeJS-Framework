//Validation Functions Across System

var Validator = require('validatorjs');

module.exports = function(server, restify) {

	initialize = function() {
		// Validator.register('telephone', function(value, requirement, attribute) { // requirement parameter defaults to null
		// 	  return value.match(/^\d{3}-\d{3}-\d{4}$/);
		// 	}, 'The :attribute phone number is not in the format XXX-XXX-XXXX.');

		Validator.register('mobile', function(value, requirement, attribute) { // requirement parameter defaults to null
			  if(value==null || value.replace(/ /g,"").length!=10) return false;
			  if(isNaN(value) || value.indexOf(" ")!=-1) return false;
			  //if(!(value.charAt(0)=="9" || value.charAt(0)=="8" || value.charAt(0)=="7")) return false;
			  
			  return true;
			}, 'The :attribute mobile number is not valid');

		Validator.register('json', function (value) {
				// If value is already an object or array, treat as valid
				if (typeof value === 'object' && value !== null) {
				return true;
				}
				// If value is a string, try parsing
				if (typeof value === 'string') {
				try {
					JSON.parse(value);
					return true;
				} catch (e) {
					return false;
				}
				}
				return false;
			},
			'The :attribute field must be valid JSON.'
		);

		//boolean

		// Validator.register(
		//     'date_between',
		//     function (value, requirement) {
		//       // custom validation using dates
		//     },
		//     'Custom message for attribute :attribute with replacements :min and :max.',
		//     function (_template, rule, _getAttributeName) {
		//       const parameters = rule.getParameters();
		//         return {
		//           min: parameters[0],
		//           max: parameters[1],
		//         };
		//     });

		console.log("\x1b[36m%s\x1b[0m","Validation Engine Initialized");
	}

	validateRule = function(formData, ruleObj) {
		let validation = new Validator(formData, ruleObj);

		return {
			"status": validation.passes(),
			"errors": validation.errors.all()
		};
	}

	return this;
}