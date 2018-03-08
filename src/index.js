'use strict'

const debug = require('debug')('sequelize-joi')
const DefaultJoi = require('Joi')

module.exports = function (sequelize, { Joi = DefaultJoi } = {}) {

  if (!sequelize) {
    throw new Error('The required sequelize instance option is missing')
  }

  sequelize.addHook('afterValidate', function (instance, options) {

    const changedKeys = []

    Object
      .keys(instance._changed)
      .forEach(function (fieldName) {
        if (instance._changed[fieldName]) {
          changedKeys.push(fieldName)
        }
      })

    if (!changedKeys.length) {
      return
    }

    debug(`Changed attributes: ${changedKeys}`)

    const modelName = instance.constructor.name

    const validationErrors = []

    changedKeys.forEach(function (fieldName) {

      const fieldDefinition = instance.rawAttributes[fieldName]

      if (!fieldDefinition['schema']) {
        return
      }

      debug(`Validation schema for attribute: ${fieldName}`)

      const schema = fieldDefinition['schema']
      const value = instance[fieldName]

      const validation = Joi.validate(value, schema, {
        abortEarly: false,
        allowUnknown: false,
        noDefaults: false,
      })

      if (validation.error) {
        validation.error.details.forEach(function (joiValidationError) {
          const errorMessageSegments = joiValidationError.message.split("\"")
          const errorPath = `${fieldName}.${joiValidationError.path.join('.')}`
          const errorMessage = `${modelName}.${errorPath}${errorMessageSegments[2]}`
          const errorType = 'invalid schema'
          const errorValue = getProperty(value, joiValidationError.path)
          const error = new sequelize.ValidationErrorItem(errorMessage, errorType, errorPath, errorValue, instance)
          validationErrors.push(error)
        })
      }

      instance[fieldName] = validation.value

    })

    if (validationErrors.length) {
      return sequelize.Promise.try(function () {
        throw new sequelize.ValidationError(null, validationErrors)
      })
    }

  })
}

function getProperty(source, path) {
  const next = path.shift()
  if (typeof next === 'undefined') {
    return source
  }
  if (typeof source[next] === 'undefined') {
    if (path.length === 0) {
      return source[next]
    }
    throw new Error('Invalid path')
  }
  return getProperty(source[next], path)
}
