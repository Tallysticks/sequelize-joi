# Sequelize Joi

Allows specifying [Joi](https://github.com/hapijs/joi) validation schema for `JSONB` model attributes in [Sequelize](https://github.com/sequelize/sequelize).

### Installation

```
npm install --save sequelize-joi
```

### Usage

```js
const Sequelize = require("sequelize");
const sequelize = new Sequelize();
const sequelizeJoi = require("sequelize-joi");
sequelizeJoi(sequelize);
```

Custom Joi object may be passed:

```js
const Joi = require("joi");
const CustomJoi = Joi.extend((joi) => {});
sequelizeJoi(sequelize, { Joi: CustomJoi });
```

### Example

```js
const SampleModel = sequelize.define("SampleModel", {
  details: {
    type: Sequelize.JSONB,
    allowNull: false,
    schema: Joi.object().keys({
      requiredString: Joi.string().required(),
      optionalString: Joi.string().default(null),
      optionalObject: Joi.object().keys({
        requiredSubNumber: Joi.number().required(),
      }),
    }),
  },
});

// Validation passes
await SampleModel.build({
  details: {
    requiredString: "One",
    optionalString: "Two",
  },
})
  .validate()
  .then((instance) => {
    // instance contains default values appended by Joi
  });

// Validation fails
await SampleModel.build({
  details: {
    optionalString: 123,
  },
})
  .validate()
  .catch((error) => {
    // error is a 'SequelizeValidationError'
    // error.errors is an array of 'SequelizeValidationErrorItem'
  });
```
