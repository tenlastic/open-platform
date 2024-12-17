import { expect } from 'chai';

import { jsonSchemaValidator } from './';

const { msg, validator } = jsonSchemaValidator;

describe('validators/json-schema', function () {
  describe('root', function () {
    describe('additionalProperties', function () {
      it('returns false', function () {
        const value = {
          additionalProperties: 'invalid',
          properties: {
            key: { type: 'string' },
          },
          type: 'object',
        };

        const result = validator(value);
        const message = msg();

        expect(message).to.eql('/additionalProperties must be boolean');
        expect(result).to.eql(false);
      });

      it('returns true', function () {
        const value = {
          additionalProperties: true,
          properties: {
            key: { type: 'string' },
          },
          type: 'object',
        };

        const result = validator(value);

        expect(result).to.eql(true);
      });
    });

    describe('properties', function () {
      describe('key', function () {
        it('returns false', function () {
          const value = {
            properties: {
              'in.valid': { type: 'object' },
            },
            type: 'object',
          };

          const result = validator(value);
          const message = msg();

          expect(message).to.eql('/properties must NOT have additional properties');
          expect(result).to.eql(false);
        });

        it('returns true', function () {
          const value = {
            properties: {
              valid: { type: 'object' },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });
      });

      describe('array types', function () {
        it('returns false', function () {
          const value = {
            properties: {
              key: {
                items: {
                  properties: {
                    key: {
                      items: { type: 'invalid' },
                      type: 'array',
                    },
                  },
                  type: 'object',
                },
                type: 'array',
              },
            },
            type: 'object',
          };

          const result = validator(value);
          const message = msg();

          expect(message).to.eql(
            '/properties/key/items/properties/key/items/type ' +
              'must be equal to one of the allowed values',
          );
          expect(result).to.eql(false);
        });

        it('returns true', function () {
          const value = {
            properties: {
              key: {
                items: {
                  properties: {
                    key: {
                      items: { type: 'string' },
                      type: 'array',
                    },
                  },
                  type: 'object',
                },
                type: 'array',
              },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });

        describe('key', function () {
          it('returns false', function () {
            const value = {
              properties: {
                key: {
                  items: {
                    properties: {
                      'invalid.key': {
                        items: { type: 'string' },
                        type: 'array',
                      },
                    },
                    type: 'object',
                  },
                  type: 'array',
                },
              },
              type: 'object',
            };

            const result = validator(value);
            const message = msg();

            expect(message).to.eql(
              '/properties/key/items/properties must NOT have additional properties',
            );
            expect(result).to.eql(false);
          });

          it('returns true', function () {
            const value = {
              properties: {
                key: {
                  items: {
                    properties: {
                      key: {
                        items: { type: 'string' },
                        type: 'array',
                      },
                    },
                    type: 'object',
                  },
                  type: 'array',
                },
              },
              type: 'object',
            };

            const result = validator(value);

            expect(result).to.eql(true);
          });
        });
      });

      describe('boolean types', function () {
        it('returns true', function () {
          const value = {
            properties: {
              key: { type: 'boolean' },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });
      });

      describe('integer types', function () {
        it('returns true', function () {
          const value = {
            properties: {
              key: { type: 'integer' },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });
      });

      describe('number types', function () {
        it('returns true', function () {
          const value = {
            properties: {
              key: { type: 'number' },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });
      });

      describe('object types', function () {
        it('returns false', function () {
          const value = {
            properties: {
              key: {
                properties: {
                  key: {
                    properties: {
                      key: { type: 'invalid' },
                    },
                    type: 'object',
                  },
                },
                type: 'object',
              },
            },
            type: 'object',
          };

          const result = validator(value);
          const message = msg();

          expect(message).to.eql(
            '/properties/key/properties/key/properties/key/type ' +
              'must be equal to one of the allowed values',
          );
          expect(result).to.eql(false);
        });

        it('returns true', function () {
          const value = {
            properties: {
              key: {
                properties: {
                  key: {
                    properties: {
                      key: { type: 'object' },
                    },
                    type: 'object',
                  },
                },
                type: 'object',
              },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });

        describe('key', function () {
          it('returns false', function () {
            const value = {
              properties: {
                key: {
                  properties: {
                    key: {
                      properties: {
                        'invalid.key': { type: 'object' },
                      },
                      type: 'object',
                    },
                  },
                  type: 'object',
                },
              },
              type: 'object',
            };

            const result = validator(value);
            const message = msg();

            expect(message).to.eql(
              '/properties/key/properties/key/properties must NOT have additional properties',
            );
            expect(result).to.eql(false);
          });

          it('returns true', function () {
            const value = {
              properties: {
                key: {
                  properties: {
                    key: {
                      properties: {
                        key: { type: 'object' },
                      },
                      type: 'object',
                    },
                  },
                  type: 'object',
                },
              },
              type: 'object',
            };

            const result = validator(value);

            expect(result).to.eql(true);
          });
        });
      });

      describe('string types', function () {
        it('returns true', function () {
          const value = {
            properties: {
              key: { type: 'string' },
            },
            type: 'object',
          };

          const result = validator(value);

          expect(result).to.eql(true);
        });

        describe('format', function () {
          it('returns false', function () {
            const value = {
              properties: {
                key: { format: 'invalid', type: 'string' },
              },
              type: 'object',
            };

            const result = validator(value);
            const message = msg();

            expect(message).to.eql(
              '/properties/key/format must be equal to one of the allowed values',
            );
            expect(result).to.eql(false);
          });

          it('returns true', function () {
            const value = {
              properties: {
                key: { format: 'date-time', type: 'string' },
              },
              type: 'object',
            };

            const result = validator(value);

            expect(result).to.eql(true);
          });
        });
      });
    });

    describe('required', function () {
      it('returns false', function () {
        const value = {
          properties: {
            key: { type: 'string' },
          },
          required: 'invalid',
          type: 'object',
        };

        const result = validator(value);
        const message = msg();

        expect(message).to.eql('/required must be array');
        expect(result).to.eql(false);
      });

      it('returns true', function () {
        const value = {
          properties: {
            key: { type: 'string' },
          },
          required: ['invalid'],
          type: 'object',
        };

        const result = validator(value);

        expect(result).to.eql(true);
      });
    });

    describe('type', function () {
      it('returns false', function () {
        const value = {
          properties: {
            key: { type: 'string' },
          },
          type: 'invalid',
        };

        const result = validator(value);
        const message = msg();

        expect(message).to.eql('/type must be equal to one of the allowed values');
        expect(result).to.eql(false);
      });

      it('returns true', function () {
        const value = {
          properties: {
            key: { type: 'string' },
          },
          type: 'object',
        };

        const result = validator(value);

        expect(result).to.eql(true);
      });
    });
  });
});
