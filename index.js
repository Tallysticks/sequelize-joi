"use strict";

const { ValidationError, ValidationErrorItem } = require("sequelize");

module.exports = (sequelize) => {
  if (!sequelize) {
    throw new Error("The required sequelize instance option is missing");
  }

  sequelize.addHook("beforeValidate", (instance) => {
    const changedKeys = Array.from(instance._changed);

    if (!changedKeys.length) {
      return;
    }

    const modelName = instance.constructor.name;

    const validationErrors = [];

    changedKeys.forEach((fieldName) => {
      const fieldDefinition = instance.rawAttributes[fieldName];

      if (!fieldDefinition || !fieldDefinition["schema"]) return;

      const schema = fieldDefinition["schema"];
      const value = instance[fieldName];

      const validation = schema.validate(value, {
        abortEarly: false,
        allowUnknown: false,
        noDefaults: false,
      });

      if (validation.error) {
        validation.error.details.forEach((joiValidationError) => {
          const errorMessageSegments = joiValidationError.message.split('"');
          const errorPath = `${fieldName}.${joiValidationError.path.join(".")}`;
          const errorMessage = `${modelName}.${errorPath}${errorMessageSegments[2]}`;
          const errorType = "invalid schema";
          const errorValue = joiValidationError.context.value;
          const error = new ValidationErrorItem(
            errorMessage,
            errorType,
            errorPath,
            errorValue,
            instance
          );
          validationErrors.push(error);
        });
      }

      instance[fieldName] = validation.value;
    });

    if (validationErrors.length) {
      throw new ValidationError(null, validationErrors);
    }
  });
};
