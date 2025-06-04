const Joi = require('joi');

const schema = Joi.object({ name: Joi.string() });

console.log('Schema properties:', Object.getOwnPropertyNames(schema));
console.log('$_root exists:', !!schema.$_root);
console.log('Constructor name:', schema.constructor.name);
console.log('Type:', schema.type);
console.log('Has validate function:', typeof schema.validate === 'function');
